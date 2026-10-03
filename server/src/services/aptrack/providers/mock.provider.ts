import { randomUUID } from "node:crypto";
import type {
  AptrackCardUpdateInput,
  AptrackLeadInput,
  AptrackLeadResult,
  IAptrackService,
} from "../aptrack.interface.js";

export class MockAptrackProvider implements IAptrackService {
  private static instance: MockAptrackProvider;
  private leads = new Map<string, AptrackLeadInput & { leadId: string; cardStatus: string; updatedAt: string }>();

  public static getInstance(): MockAptrackProvider {
    if (!MockAptrackProvider.instance) {
      MockAptrackProvider.instance = new MockAptrackProvider();
    }
    return MockAptrackProvider.instance;
  }

  public async createProspectLead(input: AptrackLeadInput): Promise<AptrackLeadResult> {
    const existing = Array.from(this.leads.values()).find((l) => l.mobile === input.mobile);
    const timestamp = new Date().toISOString();

    if (existing) {
      existing.cardStatus = input.cardStatus || existing.cardStatus;
      existing.updatedAt = timestamp;
      if (process.env.NODE_ENV !== "production") {
        console.log(`[APTRACK CRM] Updated existing lead for prospect: ${input.name} (${input.mobile})`);
      }
      return {
        leadId: existing.leadId,
        status: "UPDATED",
        message: "Existing prospect lead updated in ApTrack CRM",
        timestamp,
      };
    }

    const leadId = `APT-LEAD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    this.leads.set(leadId, {
      ...input,
      leadId,
      cardStatus: input.cardStatus || "NOT_APPLIED",
      updatedAt: timestamp,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n=================================================`);
      console.log(`[APTRACK CRM] New Prospect Lead Registered:`);
      console.log(`  Lead ID:   ${leadId}`);
      console.log(`  Name:      ${input.name}`);
      console.log(`  Mobile:    ${input.mobile}`);
      console.log(`  Email:     ${input.email}`);
      console.log(`  Education: ${input.highestEducation || "N/A"}`);
      console.log(`  Channel:   ${input.channel || "WEB_PORTAL"}`);
      console.log(`=================================================\n`);
    }

    return {
      leadId,
      status: "CREATED",
      message: "Lead created successfully in ApTrack CRM for admission follow-up",
      timestamp,
    };
  }

  public async syncLeadCardStatus(input: AptrackCardUpdateInput): Promise<void> {
    const lead = Array.from(this.leads.values()).find((l) => l.mobile === input.mobile);
    const timestamp = input.timestamp || new Date().toISOString();

    if (lead) {
      lead.cardStatus = input.cardStatus;
      lead.updatedAt = timestamp;
      if (input.last4Digits) {
        lead.maskedPan = `•••• •••• •••• ${input.last4Digits}`;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[APTRACK CRM] Synced card status for mobile ${input.mobile}: ${input.cardStatus} (Last 4: ${input.last4Digits || "N/A"})`);
    }
  }

  public getLeadByMobile(mobile: string) {
    return Array.from(this.leads.values()).find((l) => l.mobile === mobile);
  }

  public clear(): void {
    this.leads.clear();
  }
}
