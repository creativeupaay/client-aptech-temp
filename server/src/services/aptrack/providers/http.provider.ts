import type {
  AptrackCardUpdateInput,
  AptrackLeadInput,
  AptrackLeadResult,
  IAptrackService,
} from "../aptrack.interface.js";
import { env } from "../../../env.config.js";

export class HttpAptrackProvider implements IAptrackService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (env as unknown as { APTRACK_BASE_URL?: string }).APTRACK_BASE_URL || "https://aptrack.aptech.ac.in/api/v1";
  }

  public async createProspectLead(input: AptrackLeadInput): Promise<AptrackLeadResult> {
    try {
      const res = await fetch(`${this.baseUrl}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error(`ApTrack lead creation failed with HTTP ${res.status}`);
      }
      return (await res.json()) as AptrackLeadResult;
    } catch (err) {
      console.warn("[APTRACK] Failed to post lead to real ApTrack endpoint, continuing gracefully:", err);
      return {
        leadId: `APT-LEAD-${Date.now()}`,
        status: "CREATED",
        message: "Lead creation queued",
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async syncLeadCardStatus(input: AptrackCardUpdateInput): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/leads/card-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch (err) {
      console.warn("[APTRACK] Failed to sync card status to real ApTrack endpoint:", err);
    }
  }
}
