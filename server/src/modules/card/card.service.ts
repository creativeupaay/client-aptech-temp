import { Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { ApiError } from "../../utils/ApiError.js";
import { Card, type ICardDocument } from "./card.model.js";
import { CardTransaction, type ICardTransactionDocument } from "./cardTransaction.model.js";
import { TransbankFactory } from "../../services/transbank/index.js";
import { ProconnectFactory } from "../../services/proconnect/index.js";
import { AptrackFactory } from "../../services/aptrack/index.js";
import { User, type IUserDocument } from "../user/user.model.js";
import { env } from "../../env.config.js";
import { withDistributedLock } from "../../utils/distributedLock.js";
import { CacheService } from "../../utils/cache.js";
import {
  extractLast4,
  toPortalCardStatus,
} from "./cardStatusMapper.js";
import { getSenderTagPlain, setSenderTagEncrypted } from "./senderTagCrypto.js";
import type {
  CompleteFullKycInput,
  LoadMoneyInput,
  RegisterAndIssueCardInput,
} from "./card.validation.js";

const CARD_POLL_MAX_WAIT_MS = 120_000;
const CARD_POLL_BASE_INTERVAL_MS = 2_000;
const CARD_POLL_MAX_INTERVAL_MS = 8_000;
const MIN_KYC_PER_LOAD_MAX = 10_000;
const FULL_KYC_PER_LOAD_MAX = 200_000;

export class CardService {
  private static resolvePlainSenderTag(card: ICardDocument): string | null {
    return getSenderTagPlain(card.senderTag);
  }

  private static async persistEncryptedSenderTag(
    card: ICardDocument,
    plainSenderTag: string
  ): Promise<void> {
    card.senderTag = setSenderTagEncrypted(plainSenderTag);
    await card.save();
  }

  private static async syncIssuancePartners(
    studentUser: IUserDocument | null,
    card: ICardDocument
  ): Promise<void> {
    const last4 = extractLast4(card.maskedPan);
    const portalStatus = toPortalCardStatus(card.status);

    if (studentUser?.studentId) {
      ProconnectFactory.getProvider()
        .syncCardIssuance({
          studentId: studentUser.studentId,
          mobileNumber: studentUser.mobile,
          emailId: studentUser.email,
          cardStatus: portalStatus,
          cardId: card.cardId || undefined,
          last4Digits: last4,
          merchantTransactionId: card.referenceId || undefined,
          timestamp: new Date().toISOString(),
        })
        .catch((err) => console.warn("[PROCONNECT] Student card sync error:", err));
    } else if (studentUser) {
      AptrackFactory.getProvider()
        .syncLeadCardStatus({
          mobile: studentUser.mobile,
          cardStatus:
            card.status === "REJECTED"
              ? "REJECTED"
              : card.status === "APPLICATION_PENDING"
                ? "APPLICATION_PENDING"
                : "ACTIVE",
          last4Digits: last4,
          cardId: card.cardId || undefined,
          timestamp: new Date().toISOString(),
        })
        .catch((err) => console.warn("[APTRACK] Lead card status sync error:", err));
    }
  }

  /**
   * Retrieves the current user's card.
   * If no card exists, initializes a default lean NOT_APPLIED card.
   */
  public static async getCard(userId: Types.ObjectId | string): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    let card = await Card.findOne({ userId: objectId });

    if (!card) {
      card = await Card.create({
        userId: objectId,
        status: "NOT_APPLIED",
        cardType: "VIRTUAL",
        kycStatus: "MIN_KYC",
        availableBalance: 0,
        usedAmount: 0,
        totalLimit: 10000,
      });
    }

    return card;
  }

  /**
   * Dispatches OTP via TransBnk API 1.
   */
  public static async sendOtp(mobile: string): Promise<{ message: string }> {
    const transbank = TransbankFactory.getProvider();
    return await transbank.sendCustomerOtp({ mobile });
  }

  /**
   * Registers customer with TransBnk (API 2) and triggers virtual GPR card creation (API 4 + API 5).
   * Idempotent against double-clicks via distributed lock + existing referenceId reuse (ISS-07).
   */
  public static async registerAndIssue(
    userId: Types.ObjectId | string,
    input: RegisterAndIssueCardInput
  ): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

    return await withDistributedLock(`card:issue:${objectId.toString()}`, async () => {
      const card = await this.getCard(objectId);

      if ((card.status === "ACTIVE" || card.status === "ISSUED") && card.cardId) {
        return card;
      }

      // Pending application with reference — do not create again; caller polls status
      if (
        card.status === "APPLICATION_PENDING" &&
        card.referenceId &&
        this.resolvePlainSenderTag(card)
      ) {
        return card;
      }

      const studentUser = await User.findById(objectId);
      if (!studentUser) {
        throw ApiError.unauthorized("User profile not found. Please log in.");
      }

      if (studentUser.mobile && studentUser.mobile !== input.mobile) {
        throw ApiError.badRequest(
          "Mobile number does not match your registered profile mobile number."
        );
      }

      // Duplicate issuance guard by mobile: another ACTIVE card on same mobile must not exist
      const mobileOwner = await User.findOne({ mobile: input.mobile });
      if (mobileOwner && mobileOwner._id.toString() !== objectId.toString()) {
        const otherCard = await Card.findOne({ userId: mobileOwner._id });
        if (otherCard && (otherCard.status === "ACTIVE" || otherCard.status === "ISSUED") && otherCard.cardId) {
          throw ApiError.conflict(
            "A card has already been issued for this mobile number. Duplicate issuance is not allowed."
          );
        }
      }

      const transbank = TransbankFactory.getProvider();
      let senderTagPlain = this.resolvePlainSenderTag(card);

      if (!senderTagPlain) {
        try {
          const regResult = await transbank.registerCustomer({
            name: input.name,
            mobile: input.mobile,
            email: input.email,
            documentType: input.documentType,
            documentValue: input.documentValue,
            dateOfBirth: input.dateOfBirth,
            otp: input.otp,
            context: {},
          });

          senderTagPlain = regResult.senderTag;
          await this.persistEncryptedSenderTag(card, senderTagPlain);
        } catch (err: unknown) {
          if (
            err instanceof ApiError &&
            (err.statusCode === 409 || err.message?.includes("already registered"))
          ) {
            senderTagPlain = this.resolvePlainSenderTag(card);
            if (!senderTagPlain) {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }

      if (!senderTagPlain) {
        throw ApiError.badRequest("Customer registration is required before issuing card.");
      }

      let referenceId = card.referenceId;
      if (!referenceId || card.status === "NOT_APPLIED" || card.status === "REJECTED") {
        const createResult = await transbank.createCard({
          senderTag: senderTagPlain,
          cardFormFactor: "VIRTUAL",
          cardType: "GPR",
          amount: "0.00",
          context: {},
        });

        if (createResult.status === "FAILED" || !createResult.referenceId) {
          card.status = "REJECTED";
          await card.save();
          await this.syncIssuancePartners(studentUser, card);
          throw ApiError.badRequest(
            createResult.message || "Card creation request failed on TransBnk gateway."
          );
        }

        referenceId = createResult.referenceId;
        card.referenceId = referenceId;
        card.status = "APPLICATION_PENDING";
        await card.save();
      }

      let cardStatusResult: {
        status: "SUBMITTED" | "SUCCESS" | "FAILED";
        cardId?: string;
        message?: string;
        maskedPan?: string;
      } = {
        status: "SUBMITTED",
        message: "Card creation submitted to banking gateway.",
      };

      const isHttp = env.TRANSBNK_PROVIDER === "http";

      if (!isHttp) {
        try {
          const startedAt = Date.now();
          let interval = 300;
          cardStatusResult = await transbank.getCardCreationStatus({
            referenceId: referenceId!,
            senderTag: senderTagPlain,
          });

          while (
            cardStatusResult.status === "SUBMITTED" &&
            Date.now() - startedAt < 5_000
          ) {
            await new Promise((resolve) => setTimeout(resolve, interval));
            cardStatusResult = await transbank.getCardCreationStatus({
              referenceId: referenceId!,
              senderTag: senderTagPlain,
            });
          }
        } catch (pollErr) {
          console.warn("[CARD_SERVICE] Synchronous status check error:", pollErr);
        }
      }

      if (cardStatusResult.status === "FAILED") {
        card.status = "REJECTED";
        await card.save();
        await this.syncIssuancePartners(studentUser, card);
        throw ApiError.badRequest(
          cardStatusResult.message || "Card creation request failed on TransBnk gateway."
        );
      }

      if (cardStatusResult.status !== "SUCCESS" || !cardStatusResult.cardId) {
        card.status = "APPLICATION_PENDING";
        await card.save();
        return card;
      }

      card.cardId = cardStatusResult.cardId;
      card.status = "ACTIVE";
      card.issuedAt = new Date();
      if (cardStatusResult.maskedPan) {
        card.maskedPan = cardStatusResult.maskedPan;
      } else if (!card.maskedPan) {
        card.maskedPan = "•••• •••• •••• ••••";
      }
      card.totalLimit = card.kycStatus === "FULL_KYC" ? 200000 : 10000;
      await card.save();

      await this.syncIssuancePartners(studentUser, card);
      return card;
    }, { ttlMs: 30_000 });
  }

  /**
   * Directly provisions a virtual GPR card for a customer who already completed Min KYC (has senderTag).
   */
  public static async issueCard(userId: Types.ObjectId | string): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if ((card.status === "ACTIVE" || card.status === "ISSUED") && card.cardId) {
      return card;
    }

    const senderTagPlain = this.resolvePlainSenderTag(card);
    if (!senderTagPlain) {
      throw ApiError.badRequest("Customer registration is required before issuing card (senderTag missing).");
    }

    if (card.referenceId && card.status === "APPLICATION_PENDING") {
      return await this.pollCardStatus(objectId);
    }

    const transbank = TransbankFactory.getProvider();
    const createResult = await transbank.createCard({
      senderTag: senderTagPlain,
      cardFormFactor: "VIRTUAL",
      cardType: "GPR",
      amount: "0.00",
      context: {},
    });

    card.referenceId = createResult.referenceId;
    card.status = "APPLICATION_PENDING";
    await card.save();

    return await this.pollCardStatus(objectId);
  }

  /**
   * Retrieves Full KYC URL from TransBnk (API 3).
   */
  public static async getFullKycUrl(userId: Types.ObjectId | string) {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    const senderTagPlain = this.resolvePlainSenderTag(card);
    if (!senderTagPlain) {
      throw ApiError.badRequest("Student has not completed card registration (senderTag missing).");
    }

    const transbank = TransbankFactory.getProvider();
    return await transbank.getFullKycUrl({ senderId: senderTagPlain });
  }

  /**
   * Checks real Full KYC completion status via TransBnk API 3 (/full-kyc-url).
   * When kyc_required === false, automatically upgrades card to FULL_KYC and ₹2,00,000 limit.
   */
  public static async checkKycStatus(userId: Types.ObjectId | string) {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    const senderTagPlain = this.resolvePlainSenderTag(card);
    if (!senderTagPlain) {
      return {
        kycStatus: card.kycStatus,
        isCompleted: card.kycStatus === "FULL_KYC",
        totalLimit: card.totalLimit,
        kycRequired: true,
        message: "Customer registration has not been completed yet.",
      };
    }

    const transbank = TransbankFactory.getProvider();
    const kycResult = await transbank.getFullKycUrl({ senderId: senderTagPlain });

    if (!kycResult.kycRequired) {
      if (card.kycStatus !== "FULL_KYC") {
        card.kycStatus = "FULL_KYC";
        card.totalLimit = 200000;
        await card.save();
      }
      return {
        kycStatus: "FULL_KYC",
        isCompleted: true,
        totalLimit: 200000,
        kycRequired: false,
        message: "Full KYC verified successfully. Card limit upgraded to ₹2,00,000.",
      };
    }

    return {
      kycStatus: card.kycStatus,
      isCompleted: false,
      totalLimit: card.totalLimit,
      kycRequired: true,
      url: kycResult.url,
      expireOn: kycResult.expireOn,
    };
  }

  /**
   * Completes Full KYC verification and upgrades limit to ₹2,00,000.
   * In HTTP mode: verifies that TransBnk/Oxymoney gateway has approved the KYC session.
   * In Mock mode: records simulated KYC completion.
   */
  public static async completeFullKyc(
    userId: Types.ObjectId | string,
    input: CompleteFullKycInput
  ): Promise<ICardDocument> {
    if (input.isMock && (env.NODE_ENV === "production" || process.env.NODE_ENV === "production")) {
      throw ApiError.forbidden("Mock KYC completion is disabled in production.");
    }

    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    const senderTagPlain = this.resolvePlainSenderTag(card);
    if (!senderTagPlain) {
      throw ApiError.badRequest("Customer registration is required before completing Full KYC.");
    }

    const transbank = TransbankFactory.getProvider();

    // In mock mode or when explicitly mocking verification
    if (input.isMock) {
      if (transbank.simulateKycCompletion) {
        transbank.simulateKycCompletion(senderTagPlain);
      }
    } else if (env.TRANSBNK_PROVIDER === "http") {
      // In live HTTP mode, verify with TransBnk / Oxymoney that KYC was actually completed
      const kycStatusResult = await transbank.getFullKycUrl({ senderId: senderTagPlain });
      if (kycStatusResult.kycRequired) {
        throw ApiError.badRequest(
          "Full KYC has not yet been verified on the Oxymoney gateway. Please complete verification via the portal."
        );
      }
    } else if (transbank.simulateKycCompletion) {
      // In mock/dev/test mode: simulate approved KYC
      transbank.simulateKycCompletion(senderTagPlain);
    }

    card.kycStatus = "FULL_KYC";
    card.totalLimit = 200000;
    await card.save();

    return card;
  }

  /**
   * Mocks Full KYC verification for development, testing, and sandbox demonstrations.
   * Atomically upgrades card KYC status to FULL_KYC and increases limit to ₹2,00,000.
   */
  public static async mockCompleteFullKyc(
    userId: Types.ObjectId | string
  ): Promise<ICardDocument> {
    if (env.NODE_ENV === "production" || process.env.NODE_ENV === "production") {
      throw ApiError.forbidden("Mock KYC completion is disabled in production.");
    }
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    const transbank = TransbankFactory.getProvider();
    const senderTagPlain = this.resolvePlainSenderTag(card);
    if (senderTagPlain && transbank.simulateKycCompletion) {
      transbank.simulateKycCompletion(senderTagPlain);
    }

    card.kycStatus = "FULL_KYC";
    card.totalLimit = 200000;
    await card.save();

    return card;
  }

  /**
   * Polls asynchronous card creation status from TransBnk (API 5).
   * Client should poll until SUCCESS/FAILED/REJECTED or until max wait (~120s) with backoff (ISS-03).
   */
  public static async pollCardStatus(userId: Types.ObjectId | string): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (card.status === "ACTIVE" || card.status === "ISSUED" || card.status === "REJECTED") {
      return card;
    }

    const senderTagPlain = this.resolvePlainSenderTag(card);
    if (!card.referenceId || !senderTagPlain) {
      if (card.status === "APPLICATION_PENDING" && !card.referenceId) {
        card.status = "NOT_APPLIED";
        await card.save();
      }
      return card;
    }

    const pollMetaKey = `tb:poll:meta:${card.referenceId}`;
    const pollThrottleKey = `tb:poll:${card.referenceId}`;

    type PollMeta = { startedAt: number; intervalMs: number };
    let meta = await CacheService.get<PollMeta>(pollMetaKey);
    if (!meta) {
      meta = { startedAt: Date.now(), intervalMs: CARD_POLL_BASE_INTERVAL_MS };
      await CacheService.set(pollMetaKey, meta, Math.ceil(CARD_POLL_MAX_WAIT_MS / 1000) + 30);
    }

    if (Date.now() - meta.startedAt > CARD_POLL_MAX_WAIT_MS) {
      // Leave APPLICATION_PENDING; client stops and shows timeout. Do not invent FAILED.
      return card;
    }

    const isThrottled = await CacheService.get<boolean>(pollThrottleKey);
    if (isThrottled) {
      return card;
    }

    const throttleSeconds = Math.max(2, Math.ceil(meta.intervalMs / 1000));
    await CacheService.set(pollThrottleKey, true, throttleSeconds);

    // Exponential backoff for subsequent polls (2s → 4s → 8s)
    meta.intervalMs = Math.min(CARD_POLL_MAX_INTERVAL_MS, meta.intervalMs * 2);
    await CacheService.set(pollMetaKey, meta, Math.ceil(CARD_POLL_MAX_WAIT_MS / 1000) + 30);

    const transbank = TransbankFactory.getProvider();
    try {
      const statusResult = await transbank.getCardCreationStatus({
        referenceId: card.referenceId,
        senderTag: senderTagPlain,
      });

      if (statusResult.status === "SUCCESS") {
        card.cardId = statusResult.cardId;
        card.status = "ACTIVE";
        card.issuedAt = new Date();
        if (statusResult.maskedPan) {
          card.maskedPan = statusResult.maskedPan;
        } else if (!card.maskedPan) {
          card.maskedPan = "•••• •••• •••• ••••";
        }
        card.totalLimit = card.kycStatus === "FULL_KYC" ? 200000 : 10000;
        await card.save();

        const studentUser = await User.findById(objectId);
        await this.syncIssuancePartners(studentUser, card);
      } else if (statusResult.status === "FAILED") {
        card.status = "REJECTED";
        await card.save();
        const studentUser = await User.findById(objectId);
        await this.syncIssuancePartners(studentUser, card);
      }
    } catch (err) {
      console.warn("[CARD_SERVICE] pollCardStatus transient error during polling cycle:", err);
    }

    return card;
  }

  /**
   * Initializes a PCI-DSS compliant Card SDK session for secure card details view & PIN operations.
   */
  public static async getCardSdkSession(userId: Types.ObjectId | string) {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (card.status === "NOT_APPLIED") {
      throw ApiError.badRequest("Card must be applied and issued before initiating a Card SDK session.");
    }

    if (!card.cardId) {
      throw ApiError.badRequest("Active card ID is missing. Please complete card issuance or contact support.");
    }

    const studentUser = await User.findById(objectId);
    if (!studentUser) {
      throw ApiError.notFound("Student user profile not found.");
    }

    const rawMobile = studentUser.mobile || "";
    const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      throw ApiError.badRequest("Valid 10-digit mobile number is required for Card SDK session.");
    }

    const transbank = TransbankFactory.getProvider();
    const rawClientToken = await transbank.getClientToken();
    const effectiveToken =
      !rawClientToken || rawClientToken.startsWith("mock_")
        ? (env.OXYMONEY_CLIENT_TOKEN || env.TRANSBNK_CLIENT_PASSWORD || "")
        : rawClientToken;

    return {
      cardId: card.cardId,
      // Never expose senderTag (encrypted or plaintext) to the browser (SEC-01 / SEC-04)
      maskedPan: card.maskedPan || "•••• •••• •••• ••••",
      holderName: studentUser.name || "Cardholder",
      clientId: env.OXYMONEY_CLIENT_ID || env.TRANSBNK_CLIENT_ID,
      clientToken: effectiveToken,
      mobileNumber: cleanMobile,
      sdkUrl: "https://carduat.oxymoney.com",
      sdkSessionToken: `sdk_sess_${randomUUID()}`,
      environment: env.NODE_ENV === "production" ? "production" : "sandbox",
    };
  }

  /**
   * Loads money to card wallet via TransBnk API 6 and verifies execution via API 7.
   * Enforces idempotency, pre-commit lock against race conditions, atomic balance increment,
   * and resilient in-flight ledger tracking.
   */
  public static async loadMoney(
    userId: Types.ObjectId | string,
    input: LoadMoneyInput
  ): Promise<{
    transaction: ICardTransactionDocument;
    card: ICardDocument;
  }> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    return await withDistributedLock(`card:load:${card._id.toString()}`, async () => {
      if (card.status !== "ACTIVE" && card.status !== "ISSUED") {
        throw ApiError.badRequest(
          "Card is not active. Please complete card issuance before adding funds."
        );
      }

    if (!card.cardId) {
      throw ApiError.badRequest(
        "Active card ID is missing. Please poll card status or contact support."
      );
    }

    const perLoadMax =
      card.kycStatus === "FULL_KYC" ? FULL_KYC_PER_LOAD_MAX : MIN_KYC_PER_LOAD_MAX;
    if (input.amount > perLoadMax) {
      throw ApiError.badRequest(
        `Maximum load amount is ₹${perLoadMax.toLocaleString("en-IN")} for ${
          card.kycStatus === "FULL_KYC" ? "Full KYC" : "Min KYC"
        } cards.`
      );
    }

    if (card.availableBalance + input.amount > card.totalLimit) {
      throw ApiError.badRequest(
        `Total balance cannot exceed current card limit of ₹${card.totalLimit.toLocaleString(
          "en-IN"
        )}. Complete Full KYC to unlock limits up to ₹2,00,000.`
      );
    }

    const effectiveIdempotencyKey = input.idempotencyKey || `idem_${randomUUID()}`;

    // 1. Check existing transaction by idempotency key
    const existingTx = await CardTransaction.findOne({
      userId: objectId,
      idempotencyKey: effectiveIdempotencyKey,
    });
    if (existingTx) {
      if (existingTx.status === "SUCCESS") {
        const existingCard = await this.getCard(objectId);
        return { transaction: existingTx, card: existingCard };
      }
      if (existingTx.status === "PENDING") {
        throw ApiError.conflict(
          "A fund load transaction with this idempotency key is already in progress. Please poll status."
        );
      }
    }

    // 2. Pre-commit in-flight PENDING transaction to acquire atomic DB lock against concurrent requests
    const tempTxnId = `PENDING-${randomUUID().replace(/-/g, "").slice(0, 14)}`;
    let pendingTx: ICardTransactionDocument;
    try {
      pendingTx = await CardTransaction.create({
        userId: objectId,
        cardId: card.cardId,
        title: `Wallet Load - ${input.paymentMethod}`,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        txnId: tempTxnId,
        idempotencyKey: effectiveIdempotencyKey,
        type: "CR",
        status: "PENDING",
        balanceAfter: card.availableBalance,
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
        const existing = await CardTransaction.findOne({
          userId: objectId,
          idempotencyKey: effectiveIdempotencyKey,
        });
        if (existing && existing.status === "SUCCESS") {
          const currentCard = await this.getCard(objectId);
          return { transaction: existing, card: currentCard };
        }
        throw ApiError.conflict("A load request with this idempotency key is currently processing.");
      }
      throw err;
    }

    // 3. Atomically pre-reserve balance to prevent race conditions and ensure limit is respected before calling bank
    const reservedCard = await Card.findOneAndUpdate(
      {
        _id: card._id,
        $expr: {
          $lte: [{ $add: ["$availableBalance", input.amount] }, "$totalLimit"],
        },
      },
      {
        $inc: { availableBalance: input.amount },
      },
      { returnDocument: "after" }
    );

    if (!reservedCard) {
      pendingTx.status = "FAILED";
      await pendingTx.save();
      throw ApiError.badRequest(
        `Total balance cannot exceed current card limit of ₹${card.totalLimit.toLocaleString(
          "en-IN"
        )}. Complete Full KYC to unlock limits up to ₹2,00,000.`
      );
    }

    const transbank = TransbankFactory.getProvider();
    const formattedAmount = input.amount.toFixed(2);

    // 4. Call API 6: GPR Card Load
    let loadResult: { referenceId: number };
    try {
      loadResult = await transbank.loadGprCard({
        cardId: card.cardId,
        amount: formattedAmount,
      });
      pendingTx.loadReferenceId = String(loadResult.referenceId);
      await pendingTx.save();
    } catch (loadErr) {
      // Roll back pre-reserved balance on load failure
      await Card.findByIdAndUpdate(card._id, {
        $inc: { availableBalance: -input.amount },
      });
      pendingTx.status = "FAILED";
      await pendingTx.save();
      throw loadErr;
    }

    // 5. Call API 7: Load Money Status (with retry loop for SUBMITTED state)
    let statusResult = await transbank.getLoadMoneyStatus({
      referenceId: String(loadResult.referenceId),
    });

    let loadAttempts = 0;
    const isHttp = env.TRANSBNK_PROVIDER === "http";
    const maxStatusAttempts = isHttp ? 5 : 3;
    const statusPollInterval = isHttp ? 1000 : 300;
    while (statusResult.status === "SUBMITTED" && loadAttempts < maxStatusAttempts) {
      loadAttempts++;
      await new Promise((resolve) => setTimeout(resolve, statusPollInterval));
      statusResult = await transbank.getLoadMoneyStatus({
        referenceId: String(loadResult.referenceId),
      });
    }

    // 6. Assert banking gateway status
    if (statusResult.status !== "SUCCESS") {
      // Roll back pre-reserved balance if bank load did not succeed
      await Card.findByIdAndUpdate(card._id, {
        $inc: { availableBalance: -input.amount },
      });
      pendingTx.status = statusResult.status === "FAILED" ? "FAILED" : "PENDING";
      await pendingTx.save();
      throw ApiError.badRequest(
        `TransBnk fund loading ${statusResult.status.toLowerCase()} (status: ${statusResult.status}). Message: ${statusResult.message}`
      );
    }

    // 7. Finalize ledger record
    pendingTx.txnId = statusResult.txnId || `TXN${Date.now()}`;
    pendingTx.status = "SUCCESS";
    pendingTx.balanceAfter = reservedCard.availableBalance;
    await pendingTx.save();

    return { transaction: pendingTx, card: reservedCard };
    }, { ttlMs: 8000 });
  }

  /**
   * Retrieves transaction ledger history for the user.
   */
  public static async getTransactions(
    userId: Types.ObjectId | string
  ): Promise<ICardTransactionDocument[]> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    return await CardTransaction.find({ userId: objectId }).sort({ createdAt: -1 }).limit(20);
  }
}
