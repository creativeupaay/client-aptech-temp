import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";

export const DEBIT_TRANSACTION_STATUSES = ["DEBITED", "REVERSED"] as const;
export type DebitTransactionStatus = (typeof DEBIT_TRANSACTION_STATUSES)[number];

export interface IDebitTransaction {
  transactionId: string;
  studentId: string;
  userId: Types.ObjectId;
  amount: number;
  remainingBalance?: number;
  status: DebitTransactionStatus;
  orderId?: string;
  referenceId?: string;
  brandName?: string;
  reversedAt?: Date;
  reversalReason?: string;
  reversalTransactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDebitTransactionDocument extends IDebitTransaction, Document {}

const debitTransactionSchema = new Schema<IDebitTransactionDocument>(
  {
    transactionId: {
      type: String,
      required: [true, "transactionId is required"],
      unique: true,
      index: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "studentId is required"],
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: [1, "amount must be greater than zero"],
    },
    remainingBalance: {
      type: Number,
    },
    status: {
      type: String,
      enum: DEBIT_TRANSACTION_STATUSES,
      default: "DEBITED",
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    reversedAt: {
      type: Date,
    },
    reversalReason: {
      type: String,
      trim: true,
    },
    reversalTransactionId: {
      type: String,
      trim: true,
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

export const DebitTransaction: Model<IDebitTransactionDocument> = mongoose.model<IDebitTransactionDocument>(
  "DebitTransaction",
  debitTransactionSchema
);
