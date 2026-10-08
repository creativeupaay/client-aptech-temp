import mongoose, { type Document, type Model, Schema } from "mongoose";

export type UserType = "non_aptech_student" | "aptech_student";

export interface IUser {
  name: string;
  email: string;
  mobile: string;
  userType: UserType;
  studentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      index: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ["non_aptech_student", "aptech_student"],
      default: "aptech_student",
    },
    studentId: {
      type: String,
      sparse: true,
      unique: true,
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

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", userSchema);
