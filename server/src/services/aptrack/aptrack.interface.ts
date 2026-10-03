export interface AptrackLeadInput {
  leadType: "PROSPECT_STUDENT" | "CARD_APPLICANT";
  name: string;
  mobile: string;
  email: string;
  highestEducation?: string;
  city?: string;
  channel?: "WEB_PORTAL" | "WHATSAPP" | "QR_CODE" | "WALK_IN";
  source?: string;
  campaign?: string;
  cardStatus?: string;
  maskedPan?: string;
}

export interface AptrackLeadResult {
  leadId: string;
  status: "CREATED" | "UPDATED" | "DUPLICATE";
  message: string;
  timestamp: string;
}

export interface AptrackCardUpdateInput {
  leadId?: string;
  mobile: string;
  cardStatus: "APPLICATION_PENDING" | "ACTIVE" | "REJECTED";
  last4Digits?: string;
  cardId?: string;
  merchantTransactionId?: string;
  timestamp?: string;
}

export interface IAptrackService {
  /**
   * Pushes a newly registered prospect lead to ApTrack for sales follow-up and CRM nurturing.
   */
  createProspectLead(input: AptrackLeadInput): Promise<AptrackLeadResult>;

  /**
   * Synchronizes card issuance status and last 4 digits against the lead in ApTrack.
   */
  syncLeadCardStatus(input: AptrackCardUpdateInput): Promise<void>;
}
