import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";

export interface ICardTransaction {
  userId: Types.ObjectId;
  cardId?: string | null;
  title: string;
  amount: number;
  paymentMethod?: string | null;
  txnId: string;
  loadReferenceId?: string | null;
  idempotencyKey?: string | null;
  type: "CR" | "DR";
  status: "SUCCESS" | "FAILED" | "PENDING";
  balanceAfter: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICardTransactionDocument extends ICardTransaction, Document {}

const cardTransactionSchema = new Schema<ICardTransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required for transaction"],
      index: true,
    },
    cardId: {
      type: String,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: 0,
    },
    paymentMethod: {
      type: String,
      default: null,
      trim: true,
    },
    txnId: {
      type: String,
      required: [true, "txnId is required"],
      unique: true,
      index: true,
      trim: true,
    },
    loadReferenceId: {
      type: String,
      default: null,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      default: undefined,
      trim: true,
    },
    type: {
      type: String,
      enum: ["CR", "DR"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "SUCCESS",
      index: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
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

// Idempotency constraint per student: only enforce uniqueness when idempotencyKey is an actual string
cardTransactionSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);

export const CardTransaction: Model<ICardTransactionDocument> =
  mongoose.model<ICardTransactionDocument>("CardTransaction", cardTransactionSchema);
