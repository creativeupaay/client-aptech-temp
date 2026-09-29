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
  maskedPan?: string | null;
  issuerKitNo?: string | null;
  issuedAt?: Date | null;
  isLocked: boolean;
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
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Card: Model<ICardDocument> = mongoose.model<ICardDocument>("Card", cardSchema);
