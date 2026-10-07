import { randomUUID } from "node:crypto";
import type {
  ITransbankProvider,
  TransbankCardCreateInput,
  TransbankCardCreateResult,
  TransbankCardCreationStatusInput,
  TransbankCardCreationStatusResult,
  TransbankFullKycUrlInput,
  TransbankFullKycUrlResult,
  TransbankGprLoadInput,
  TransbankGprLoadResult,
  TransbankLoadMoneyStatusInput,
  TransbankLoadMoneyStatusResult,
  TransbankRegisterInput,
  TransbankRegisterResult,
  TransbankSendOtpInput,
  TransbankSendOtpResult,
} from "../transbank.interface.js";

interface MockCardJob {
  referenceId: string;
  senderTag: string;
  cardId: string;
  attempts: number;
}

export class MockTransbankProvider implements ITransbankProvider {
  private cardJobs = new Map<string, MockCardJob>();
  private loadJobs = new Map<string, { cardId: string; amount: string; txnId: string }>();
  private completedKycSenders = new Set<string>();
  private nextLoadRef = 269;

  public async sendCustomerOtp(input: TransbankSendOtpInput): Promise<TransbankSendOtpResult> {
    const maskedMobile =
      input.mobile.length >= 10 ? `+91 ******${input.mobile.slice(-4)}` : input.mobile;
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n=================================================`);
      console.log(`[MOCK TRANSBNK] Customer OTP sent to mobile: ${maskedMobile}`);
      console.log(`[MOCK TRANSBNK] Simulated TransBnk OTP is: 123456`);
      console.log(`=================================================\n`);
    }
    return {
      message: "OTP sent successfully",
    };
  }

  public async registerCustomer(input: TransbankRegisterInput): Promise<TransbankRegisterResult> {
    const senderTag = randomUUID();
    return {
      senderTag,
      message: "Customer registered successfully.",
    };
  }

  public simulateKycCompletion(senderId: string): void {
    this.completedKycSenders.add(senderId);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MOCK TRANSBNK] Simulated KYC completion recorded for senderId: ${senderId}`);
    }
  }

  public async getFullKycUrl(input: TransbankFullKycUrlInput): Promise<TransbankFullKycUrlResult> {
    if (this.completedKycSenders.has(input.senderId)) {
      return {
        url: "",
        expireOn: "",
        kycRequired: false,
        taxationRequired: "false",
      };
    }

    const sessionToken = randomUUID().replace(/-/g, "").slice(0, 16);
    const expireOn = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    return {
      url: `https://carduat.oxymoney.com/proxy/endpoint/e-kyc/v2/process?session=${sessionToken}&senderId=${input.senderId}`,
      expireOn,
      kycRequired: true,
      taxationRequired: "true",
    };
  }

  public async createCard(input: TransbankCardCreateInput): Promise<TransbankCardCreateResult> {
    const referenceId = randomUUID();
    const cardId = randomUUID();

    this.cardJobs.set(referenceId, {
      referenceId,
      senderTag: input.senderTag,
      cardId,
      attempts: 0,
    });

    return {
      referenceId,
      isOtpRequired: false,
      cardId: "",
      status: "SUBMITTED",
      message: "Card creation request sent successfully",
    };
  }

  public async getCardCreationStatus(
    input: TransbankCardCreationStatusInput
  ): Promise<TransbankCardCreationStatusResult> {
    const job = this.cardJobs.get(input.referenceId);
    if (!job) {
      return {
        referenceId: input.referenceId,
        isOtpRequired: false,
        cardId: randomUUID(),
        status: "SUCCESS",
        message: "Card created successfully.",
        maskedPan: "•••• •••• •••• 8942",
      };
    }

    job.attempts += 1;
    return {
      referenceId: job.referenceId,
      isOtpRequired: false,
      cardId: job.cardId,
      status: "SUCCESS",
      message: "Card created successfully.",
      maskedPan: "•••• •••• •••• 8942",
    };
  }

  public async loadGprCard(input: TransbankGprLoadInput): Promise<TransbankGprLoadResult> {
    const ref = this.nextLoadRef++;
    const txnId = `TXN${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}${Math.floor(100 + Math.random() * 900)}`;

    this.loadJobs.set(String(ref), {
      cardId: input.cardId,
      amount: input.amount,
      txnId,
    });

    return {
      referenceId: ref,
    };
  }

  public async getLoadMoneyStatus(
    input: TransbankLoadMoneyStatusInput
  ): Promise<TransbankLoadMoneyStatusResult> {
    const job = this.loadJobs.get(input.referenceId);
    const txnId = job?.txnId || `TXN${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;

    return {
      txnId,
      status: "SUCCESS",
      message: "SUCCESS",
    };
  }

  public async getClientToken(): Promise<string> {
    return `mock_client_token_${Date.now()}`;
  }
}
