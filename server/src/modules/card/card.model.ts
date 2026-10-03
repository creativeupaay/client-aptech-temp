import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";

export const CARD_STATUSES = [
  "NOT_APPLIED",
  "APPLICATION_PENDING",
  "ISSUED",
  "ACTIVE",
  "FROZEN",
  "BLOCKED",
] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];
export type CardType = "VIRTUAL" | "PHYSICAL";
export type KycStatus = "MIN_KYC" | "FULL_KYC";

export interface ICard {
  userId: Types.ObjectId;
  status: CardStatus;
  cardType: CardType;
  kycStatus: KycStatus;
  senderTag?: string | null;
  cardId?: string | null;
  referenceId?: string | null;
  maskedPan?: string | null;
  issuerKitNo?: string | null;
  issuedAt?: Date | null;
  availableBalance: number;
  usedAmount: number;
  totalLimit: number;
  isLocked: boolean;
  isCardEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICardDocument extends ICard, Document {}

const cardSchema = new Schema<ICardDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required for Card linkage"],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: CARD_STATUSES,
        message: "{VALUE} is not a valid card status",
      },
      default: "NOT_APPLIED",
      index: true,
    },
    cardType: {
      type: String,
      enum: ["VIRTUAL", "PHYSICAL"],
      default: "VIRTUAL",
    },
    kycStatus: {
      type: String,
      enum: ["MIN_KYC", "FULL_KYC"],
      default: "MIN_KYC",
      index: true,
    },
    senderTag: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    cardId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    referenceId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    maskedPan: {
      type: String,
      default: null,
      trim: true,
    },
    issuerKitNo: {
      type: String,
      default: null,
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLimit: {
      type: Number,
      default: 10000,
      min: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isCardEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.cvv;
        delete ret.cardNumber;
        delete ret.expiry;
        return ret;
      },
    },
  }
);

export const Card: Model<ICardDocument> = mongoose.model<ICardDocument>("Card", cardSchema);
