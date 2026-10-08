import mongoose from "mongoose";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

interface SeedStudentData {
  name: string;
  mobile: string;
  email: string;
  studentId: string;
  senderTag: string;
  cardId: string;
  referenceId: string;
  maskedPan: string;
  kycStatus: "MIN_KYC" | "FULL_KYC";
  availableBalance: number;
  totalLimit: number;
}

const STUDENTS_TO_SEED: SeedStudentData[] = [
  {
    name: "Amit Sunda",
    mobile: "8000257053",
    email: "amit.sunda14@example.com",
    studentId: "APT-2026-89490",
    senderTag: "dc22def0-1137-4063-be02-2243c72c0b11",
    cardId: "81eff9ac-f1ce-4148-9f27-9f8971fca5e7",
    referenceId: "57e03a3e-b016-46d8-8cdb-91ae70a51b0d",
    maskedPan: "•••• •••• •••• 8942",
    kycStatus: "MIN_KYC",
    availableBalance: 2500,
    totalLimit: 10000,
  },
  {
    name: "Manish Kumar Bulchandani",
    mobile: "9352005086",
    email: "manish@creativeupaay.com",
    studentId: "APT-2026-MANISH",
    senderTag: "131e1157-ac0f-4519-8fdb-f1068533cc09",
    cardId: "1f25a738-a8d7-498d-a2b1-b137da99344b",
    referenceId: "cd213e24-42b4-456f-bc60-8e63d9eb1fd5",
    maskedPan: "•••• •••• •••• 8942",
    kycStatus: "FULL_KYC",
    availableBalance: 5000,
    totalLimit: 200000,
  },
];

async function seedAll() {
  console.log("Connecting to MongoDB:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  for (const item of STUDENTS_TO_SEED) {
    let user = await User.findOne({
      $or: [{ mobile: item.mobile }, { studentId: item.studentId }],
    });

    if (!user) {
      user = await User.create({
        name: item.name,
        mobile: item.mobile,
        email: item.email,
        userType: "aptech_student",
        studentId: item.studentId,
      });
      console.log(`[USER CREATED] ${user.name} (${user.mobile}), ID: ${user._id}`);
    } else {
      user.name = item.name;
      user.mobile = item.mobile;
      user.email = item.email;
      user.studentId = item.studentId;
      user.userType = "aptech_student";
      await user.save();
      console.log(`[USER UPDATED] ${user.name} (${user.mobile}), ID: ${user._id}`);
    }

    let card = await Card.findOne({ userId: user._id });
    if (card) {
      card.status = "ACTIVE";
      card.cardType = "VIRTUAL";
      card.kycStatus = item.kycStatus;
      card.senderTag = item.senderTag;
      card.cardId = item.cardId;
      card.referenceId = item.referenceId;
      card.maskedPan = item.maskedPan;
      card.availableBalance = item.availableBalance;
      card.usedAmount = 0;
      card.totalLimit = item.totalLimit;
      card.issuedAt = card.issuedAt || new Date();
      await card.save();
      console.log(`[CARD UPDATED] ${item.kycStatus} card for ${user.name}\n`);
    } else {
      card = await Card.create({
        userId: user._id,
        status: "ACTIVE",
        cardType: "VIRTUAL",
        kycStatus: item.kycStatus,
        senderTag: item.senderTag,
        cardId: item.cardId,
        referenceId: item.referenceId,
        maskedPan: item.maskedPan,
        availableBalance: item.availableBalance,
        usedAmount: 0,
        totalLimit: item.totalLimit,
        issuedAt: new Date(),
      });
      console.log(`[CARD CREATED] ${item.kycStatus} card for ${user.name}\n`);
    }
  }

  // Remove any orphaned cards with non-existent users
  const allUserIds = (await User.find({}, { _id: 1 })).map((u) => u._id);
  const deleteResult = await Card.deleteMany({ userId: { $nin: allUserIds } });
  if (deleteResult.deletedCount > 0) {
    console.log(`[CLEANUP] Pruned ${deleteResult.deletedCount} orphaned card(s).`);
  }

  console.log("=======================================================");
  console.log("Successfully seeded students Amit Sunda & Manish Kumar Bulchandani!");
  console.log("=======================================================\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seedAll().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
