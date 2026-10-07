import crypto from "crypto";
import { ApiError } from "../../../utils/ApiError.js";
import type {
  IProconnectService,
  ProconnectCardSyncInput,
  ProconnectStudentProfile,
} from "../proconnect.interface.js";

interface StoredCodeEntry {
  profile: ProconnectStudentProfile;
  expiresAt: number;
}

export class MockProconnectProvider implements IProconnectService {
  private static instance: MockProconnectProvider;
  private codeStore: Map<string, StoredCodeEntry> = new Map();

  private constructor() {
    // Seed a standard demo code for quick testing/dev
    this.seedDemoCode();
  }

  public static getInstance(): MockProconnectProvider {
    if (!MockProconnectProvider.instance) {
      MockProconnectProvider.instance = new MockProconnectProvider();
    }
    return MockProconnectProvider.instance;
  }

  private seedDemoCode(): void {
    const demoCode = "demo_proconnect_auth_code_2026";
    this.codeStore.set(demoCode, {
      profile: {
        studentId: "APT-2026-00417",
        name: "Aarav Sharma",
        mobile: "9876543210",
        email: "aarav.sharma@example.com",
      },
      // 24-hour expiration for demo code
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Generates a single-use authorization code with 60-second expiration for a student profile.
   */
  public async generateMockCode(customProfile?: Partial<ProconnectStudentProfile>): Promise<string> {
    const code = `pc_auth_${crypto.randomBytes(16).toString("hex")}`;
    const profile: ProconnectStudentProfile = {
      studentId: customProfile?.studentId || `APT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      name: customProfile?.name || "Aarav Sharma",
      mobile: customProfile?.mobile || "9876543210",
      email: customProfile?.email || "aarav.sharma@example.com",
    };

    this.codeStore.set(code, {
      profile,
      expiresAt: Date.now() + 60 * 1000,
    });

    return code;
  }

  /**
   * Exchanges authorization code for student details. Enforces single-use.
   */
  public async exchangeCode(code: string): Promise<ProconnectStudentProfile> {
    const entry = this.codeStore.get(code);
    if (!entry) {
      throw ApiError.badRequest(
        "Invalid or expired authorization code. Please initiate SSO again."
      );
    }

    // Burn code immediately (single-use)
    this.codeStore.delete(code);

    if (Date.now() > entry.expiresAt) {
      throw ApiError.badRequest("Authorization code has expired. Please initiate SSO again.");
    }

    return entry.profile;
  }

  /**
   * Records student card issuance and synchronizes back to ProConnect ecosystem.
   */
  public async syncCardIssuance(input: ProconnectCardSyncInput): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n=================================================`);
      console.log(`[PROCONNECT CARD SYNC] Card issuance synced back to ProConnect:`);
      console.log(`  Student ID:     ${input.studentId}`);
      console.log(`  Mobile:         ${input.mobileNumber}`);
      console.log(`  Card Status:    ${input.cardStatus}`);
      console.log(`  Last 4 Digits:  ${input.last4Digits || "N/A"}`);
      console.log(`  Timestamp:      ${input.timestamp || new Date().toISOString()}`);
      console.log(`=================================================\n`);
    }
  }

  /**
   * Clears all simulated codes (used in automated tests).
   */
  public clearStore(): void {
    this.codeStore.clear();
    this.seedDemoCode();
  }
}
