import mongoose, { type Document, type Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export const HIGHEST_EDUCATION_OPTIONS = [
  "10th Standard",
  "12th Standard",
  "Diploma / ITI",
  "Undergraduate / Bachelor's",
  "Postgraduate / Master's",
  "Doctorate / Other",
] as const;

export type HighestEducation = (typeof HIGHEST_EDUCATION_OPTIONS)[number];
export type UserRole = "student" | "admin";
export type UserType = "non_aptech_student" | "aptech_student";
export type UserStatus = "pending_verification" | "active" | "suspended";

export interface IUser {
  name: string;
  email: string;
  mobile: string;
  highestEducation: HighestEducation;
  city?: string;
  passwordHash: string;
  role: UserRole;
  userType: UserType;
  studentId?: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

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
    highestEducation: {
      type: String,
      required: [true, "Highest education is required"],
      enum: {
        values: HIGHEST_EDUCATION_OPTIONS,
        message: "{VALUE} is not a supported education qualification",
      },
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
      default: null,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    userType: {
      type: String,
      enum: ["non_aptech_student", "aptech_student"],
      default: "non_aptech_student",
    },
    studentId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending_verification", "active", "suspended"],
      default: "pending_verification",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to verify candidate password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = this as unknown as { passwordHash: string };
  return bcrypt.compare(candidatePassword, user.passwordHash);
};

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", userSchema);
