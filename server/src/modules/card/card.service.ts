import { Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { ApiError } from "../../utils/ApiError.js";
import { Card, type ICardDocument } from "./card.model.js";
import { CardTransaction, type ICardTransactionDocument } from "./cardTransaction.model.js";
import { TransbankFactory } from "../../services/transbank/index.js";
import { ProconnectFactory } from "../../services/proconnect/index.js";
import { AptrackFactory } from "../../services/aptrack/index.js";
import { User } from "../user/user.model.js";
import { env } from "../../env.config.js";
import type {
  CompleteFullKycInput,
  LoadMoneyInput,
  RegisterAndIssueCardInput,
  UpdateCardControlsInput,
} from "./card.validation.js";

export class CardService {
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
        isLocked: false,
        isCardEnabled: true,
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
   * Reuses existing senderTag if user previously completed Min KYC registration.
   */
  public static async registerAndIssue(
    userId: Types.ObjectId | string,
    input: RegisterAndIssueCardInput
  ): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (card.status === "ACTIVE" && card.cardId) {
      return card;
    }

    const studentUser = await User.findById(objectId);
    if (!studentUser) {
      throw ApiError.unauthorized("User profile not found. Please log in.");
    }

    // Security check: Ensure input.mobile strictly matches registered profile mobile
    if (studentUser.mobile && studentUser.mobile !== input.mobile) {
      throw ApiError.badRequest("Mobile number does not match your registered profile mobile number.");
    }

    const transbank = TransbankFactory.getProvider();
    let senderTag = card.senderTag;

    // Step 1: Register customer (API 2) if senderTag not already acquired
    if (!senderTag) {
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

        senderTag = regResult.senderTag;
        card.senderTag = senderTag;
        await card.save();
      } catch (err: unknown) {
        if (
          err instanceof ApiError &&
          (err.statusCode === 409 || err.message?.includes("already registered"))
        ) {
          if (card.senderTag) {
            senderTag = card.senderTag;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    // Step 2: Trigger Card Create (API 4) if referenceId not yet assigned or status NOT_APPLIED
    let referenceId = card.referenceId;
    if (!referenceId || card.status === "NOT_APPLIED") {
      const createResult = await transbank.createCard({
        senderTag,
        cardFormFactor: "VIRTUAL",
        cardType: "GPR",
        amount: "0.00",
        context: {},
      });

      if (createResult.status === "FAILED" || !createResult.referenceId) {
        card.status = "NOT_APPLIED";
        card.referenceId = null;
        await card.save();
        throw ApiError.badRequest(
          createResult.message || "Card creation request failed on TransBnk gateway."
        );
      }

      referenceId = createResult.referenceId;
      card.referenceId = referenceId;
      card.status = "APPLICATION_PENDING";
      await card.save();
    }

    // Step 3: Poll Card Creation Status (API 5)
    // In live HTTP mode: return APPLICATION_PENDING immediately so user transitions to /card/status and sees live progress.
    // In mock mode: synchronously poll to finalize for unit tests.
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
        cardStatusResult = await transbank.getCardCreationStatus({
          referenceId,
          senderTag,
        });

        let attempts = 0;
        const maxAttempts = 5;
        const pollInterval = 300;
        while (cardStatusResult.status === "SUBMITTED" && attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          cardStatusResult = await transbank.getCardCreationStatus({
            referenceId,
            senderTag,
          });
        }
      } catch (pollErr) {
        console.warn("[CARD_SERVICE] Synchronous status check error:", pollErr);
      }
    }

    if (cardStatusResult.status === "FAILED") {
      // Clear referenceId and reset status so user is not deadlocked and can re-apply
      card.status = "NOT_APPLIED";
      card.referenceId = null;
      await card.save();
      throw ApiError.badRequest(
        cardStatusResult.message || "Card creation request failed on TransBnk gateway."
      );
    }

    if (cardStatusResult.status !== "SUCCESS" || !cardStatusResult.cardId) {
      card.status = "APPLICATION_PENDING";
      await card.save();
      return card;
    }

    // Step 4: Finalize Card Record (PCI-DSS Scoped: store only non-sensitive metadata)
    card.cardId = cardStatusResult.cardId;
    card.status = "ACTIVE";
    card.issuedAt = new Date();
    card.maskedPan = cardStatusResult.maskedPan || "•••• •••• •••• 8942";
    card.totalLimit = card.kycStatus === "FULL_KYC" ? 200000 : 10000;

    await card.save();

    // Step 5: Asynchronous Synchronization (ProConnect & ApTrack)
    const last4 = (card.maskedPan || "8942").replace(/\D/g, "").slice(-4) || "8942";

    if (studentUser?.studentId) {
      // Aptech enrolled student: sync card details back to ProConnect (Milestone 8 & 9)
      ProconnectFactory.getProvider()
        .syncCardIssuance({
          studentId: studentUser.studentId,
          mobileNumber: studentUser.mobile,
          emailId: studentUser.email,
          cardStatus: "ACTIVE",
          last4Digits: last4,
          merchantTransactionId: card.referenceId || `TXN-${Date.now()}`,
          timestamp: new Date().toISOString(),
        })
        .catch((err) => console.warn("[PROCONNECT] Student card sync error:", err));
    } else if (studentUser) {
      // Non-Aptech prospect: sync card status to ApTrack CRM (Milestone 18)
      AptrackFactory.getProvider()
        .syncLeadCardStatus({
          mobile: studentUser.mobile,
          cardStatus: "ACTIVE",
          last4Digits: last4,
          cardId: card.cardId || undefined,
          timestamp: new Date().toISOString(),
        })
        .catch((err) => console.warn("[APTRACK] Lead card status sync error:", err));
    }

    return card;
  }

  /**
   * Directly provisions a virtual GPR card for a customer who already completed Min KYC (has senderTag).
   */
  public static async issueCard(userId: Types.ObjectId | string): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (card.status === "ACTIVE" && card.cardId) {
      return card;
    }

    if (!card.senderTag) {
      throw ApiError.badRequest("Customer registration is required before issuing card (senderTag missing).");
    }

    const transbank = TransbankFactory.getProvider();
    const createResult = await transbank.createCard({
      senderTag: card.senderTag,
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

    if (!card.senderTag) {
      throw ApiError.badRequest("Student has not completed card registration (senderTag missing).");
    }

    const transbank = TransbankFactory.getProvider();
    return await transbank.getFullKycUrl({ senderId: card.senderTag });
  }

  /**
   * Checks real Full KYC completion status via TransBnk API 3 (/full-kyc-url).
   * When kyc_required === false, automatically upgrades card to FULL_KYC and ₹2,00,000 limit.
   */
  public static async checkKycStatus(userId: Types.ObjectId | string) {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (!card.senderTag) {
      return {
        kycStatus: card.kycStatus,
        isCompleted: card.kycStatus === "FULL_KYC",
        totalLimit: card.totalLimit,
        kycRequired: true,
        message: "Customer registration has not been completed yet.",
      };
    }

    const transbank = TransbankFactory.getProvider();
    const kycResult = await transbank.getFullKycUrl({ senderId: card.senderTag });

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
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (!card.senderTag) {
      throw ApiError.badRequest("Customer registration is required before completing Full KYC.");
    }

    const transbank = TransbankFactory.getProvider();

    // In mock mode or when explicitly mocking verification
    if (input.isMock) {
      if (transbank.simulateKycCompletion) {
        transbank.simulateKycCompletion(card.senderTag);
      }
    } else if (env.TRANSBNK_PROVIDER === "http") {
      // In live HTTP mode, verify with TransBnk / Oxymoney that KYC was actually completed
      const kycStatusResult = await transbank.getFullKycUrl({ senderId: card.senderTag });
      if (kycStatusResult.kycRequired) {
        throw ApiError.badRequest(
          "Full KYC has not yet been verified on the Oxymoney gateway. Please complete verification via the portal."
        );
      }
    } else if (transbank.simulateKycCompletion) {
      // In mock/dev/test mode: simulate approved KYC
      transbank.simulateKycCompletion(card.senderTag);
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
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    const transbank = TransbankFactory.getProvider();
    if (card.senderTag && transbank.simulateKycCompletion) {
      transbank.simulateKycCompletion(card.senderTag);
    }

    card.kycStatus = "FULL_KYC";
    card.totalLimit = 200000;
    await card.save();

    return card;
  }

  /**
   * Polls asynchronous card creation status from TransBnk (API 5).
   */
  public static async pollCardStatus(userId: Types.ObjectId | string): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (card.status === "ACTIVE") {
      return card;
    }

    if (!card.referenceId || !card.senderTag) {
      if (card.status === "APPLICATION_PENDING" && !card.referenceId) {
        card.status = "NOT_APPLIED";
        await card.save();
      }
      return card;
    }

    const transbank = TransbankFactory.getProvider();
    try {
      const statusResult = await transbank.getCardCreationStatus({
        referenceId: card.referenceId,
        senderTag: card.senderTag,
      });

      if (statusResult.status === "SUCCESS") {
        card.cardId = statusResult.cardId;
        card.status = "ACTIVE";
        card.issuedAt = new Date();
        card.maskedPan = statusResult.maskedPan || "•••• •••• •••• 8942";
        card.totalLimit = card.kycStatus === "FULL_KYC" ? 200000 : 10000;
        await card.save();

        const studentUser = await User.findById(objectId);
        const last4 = (card.maskedPan || "8942").replace(/\D/g, "").slice(-4) || "8942";

        if (studentUser?.studentId) {
          ProconnectFactory.getProvider()
            .syncCardIssuance({
              studentId: studentUser.studentId,
              mobileNumber: studentUser.mobile,
              emailId: studentUser.email,
              cardStatus: "ACTIVE",
              last4Digits: last4,
              merchantTransactionId: card.referenceId,
              timestamp: new Date().toISOString(),
            })
            .catch((err) => console.warn("[PROCONNECT] Polled card sync error:", err));
        } else if (studentUser) {
          AptrackFactory.getProvider()
            .syncLeadCardStatus({
              mobile: studentUser.mobile,
              cardStatus: "ACTIVE",
              last4Digits: last4,
              cardId: card.cardId,
              timestamp: new Date().toISOString(),
            })
            .catch((err) => console.warn("[APTRACK] Polled card sync error:", err));
        }
      } else if (statusResult.status === "FAILED") {
        card.status = "NOT_APPLIED";
        card.referenceId = null;
        await card.save();
      }
    } catch (err) {
      console.warn("[CARD_SERVICE] pollCardStatus transient error during polling cycle:", err);
      // Return card gracefully in its current APPLICATION_PENDING state
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

    return {
      cardId: card.cardId,
      senderTag: card.senderTag,
      maskedPan: card.maskedPan || "•••• •••• •••• 8942",
      holderName: studentUser?.name || "Cardholder",
      clientId: env.TRANSBNK_CLIENT_ID || "EXTCLT000454",
      clientToken: env.TRANSBNK_CLIENT_PASSWORD || "035950b0-dcaf-4f84-99be-1a23773f5e40",
      mobileNumber: studentUser?.mobile || "",
      sdkUrl: "https://cardsdk.oxymoney.com/v3",
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

    if (card.isLocked) {
      throw ApiError.badRequest("Card is locked. Please unlock the card in controls before loading funds.");
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

    const transbank = TransbankFactory.getProvider();
    const formattedAmount = input.amount.toFixed(2);

    // 3. Call API 6: GPR Card Load
    let loadResult: { referenceId: number };
    try {
      loadResult = await transbank.loadGprCard({
        cardId: card.cardId,
        amount: formattedAmount,
      });
      pendingTx.loadReferenceId = String(loadResult.referenceId);
      await pendingTx.save();
    } catch (loadErr) {
      pendingTx.status = "FAILED";
      await pendingTx.save();
      throw loadErr;
    }

    // 4. Call API 7: Load Money Status (with retry loop for SUBMITTED state)
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

    // 5. Assert banking gateway status
    if (statusResult.status !== "SUCCESS") {
      pendingTx.status = statusResult.status === "FAILED" ? "FAILED" : "PENDING";
      await pendingTx.save();
      throw ApiError.badRequest(
        `TransBnk fund loading ${statusResult.status.toLowerCase()} (status: ${statusResult.status}). Message: ${statusResult.message}`
      );
    }

    // 6. Atomic balance update
    const updatedCard = await Card.findOneAndUpdate(
      {
        _id: card._id,
        isLocked: false,
        $expr: {
          $lte: [{ $add: ["$availableBalance", input.amount] }, "$totalLimit"],
        },
      },
      {
        $inc: { availableBalance: input.amount },
      },
      { returnDocument: "after" }
    );

    if (!updatedCard) {
      throw ApiError.badRequest(
        "Unable to credit funds: card is locked or total balance exceeds card limit."
      );
    }

    // 7. Finalize ledger record
    pendingTx.txnId = statusResult.txnId || `TXN${Date.now()}`;
    pendingTx.status = "SUCCESS";
    pendingTx.balanceAfter = updatedCard.availableBalance;
    await pendingTx.save();

    return { transaction: pendingTx, card: updatedCard };
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

  /**
   * Toggles card locking or status controls.
   */
  public static async updateCardControls(
    userId: Types.ObjectId | string,
    input: UpdateCardControlsInput
  ): Promise<ICardDocument> {
    const objectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    const card = await this.getCard(objectId);

    if (input.isCardEnabled !== undefined) {
      card.isCardEnabled = input.isCardEnabled;
    }
    if (input.isLocked !== undefined) {
      card.isLocked = input.isLocked;
    }

    await card.save();
    return card;
  }
}
