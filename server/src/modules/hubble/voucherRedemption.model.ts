import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";

export const VOUCHER_STATUSES = [
  "ACTIVE",
  "SUCCESS",
  "COMPLETED",
  "PENDING",
  "FAILED",
  "USED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

export interface IVoucherRedemption {
  userId: Types.ObjectId;
  studentId?: string;
  orderId: string;
  brandName: string;
  brandId?: string;
  voucherCode?: string;
  pin?: string;
  denomination: number;
  pointsDebited: number;
  expiryDate?: string;
  redemptionUrl?: string;
  status: VoucherStatus;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVoucherRedemptionDocument extends IVoucherRedemption, Document {}

const voucherRedemptionSchema = new Schema<IVoucherRedemptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    studentId: {
      type: String,
      sparse: true,
      index: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: [true, "orderId is required"],
      unique: true,
      index: true,
      trim: true,
    },
    brandName: {
      type: String,
      required: [true, "brandName is required"],
      trim: true,
    },
    brandId: {
      type: String,
      trim: true,
    },
    voucherCode: {
      type: String,
      trim: true,
    },
    pin: {
      type: String,
      trim: true,
    },
    denomination: {
      type: Number,
      required: true,
    },
    pointsDebited: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: String,
      trim: true,
    },
    redemptionUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: VOUCHER_STATUSES,
      default: "ACTIVE",
      index: true,
    },
    transactionId: {
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

export const VoucherRedemption: Model<IVoucherRedemptionDocument> = mongoose.model<IVoucherRedemptionDocument>(
  "VoucherRedemption",
  voucherRedemptionSchema
);
