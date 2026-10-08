import mongoose from "mongoose";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

async function seedAmit() {
  console.log("Connecting to MongoDB:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  const mobile = "8000257053";
  const name = "Amit Sunda";
  const email = "amit.sunda14@example.com";
  const studentId = "APT-2026-89490";
  const senderTag = "dc22def0-1137-4063-be02-2243c72c0b11";
  const cardId = "81eff9ac-f1ce-4148-9f27-9f8971fca5e7";
  const referenceId = "57e03a3e-b016-46d8-8cdb-91ae70a51b0d";

  let user = await User.findOne({
    $or: [{ mobile }, { studentId }],
  });

  if (!user) {
    user = await User.create({
      name,
      mobile,
      email,
      userType: "aptech_student",
      studentId,
    });
    console.log(`[SEED] Created new student: ${user.name} (${user.mobile}), ID: ${user._id}`);
  } else {
    user.name = name;
    user.mobile = mobile;
    user.email = email;
    user.studentId = studentId;
    user.userType = "aptech_student";
    await user.save();
    console.log(`[SEED] Updated existing student: ${user.name} (${user.mobile}), ID: ${user._id}`);
  }

  // Ensure card exists and is linked
  let card = await Card.findOne({ userId: user._id });
  if (card) {
    card.status = "ACTIVE";
    card.cardType = "VIRTUAL";
    card.kycStatus = "MIN_KYC";
    card.senderTag = senderTag;
    card.cardId = cardId;
    card.referenceId = referenceId;
    card.maskedPan = "•••• •••• •••• 8942";
    card.availableBalance = 2500;
    card.usedAmount = 0;
    card.totalLimit = 10000;
    card.issuedAt = card.issuedAt || new Date();
    await card.save();
    console.log(`[SEED] Updated active card for: ${user.name}`);
  } else {
    card = await Card.create({
      userId: user._id,
      status: "ACTIVE",
      cardType: "VIRTUAL",
      kycStatus: "MIN_KYC",
      senderTag,
      cardId,
      referenceId,
      maskedPan: "•••• •••• •••• 8942",
      availableBalance: 2500,
      usedAmount: 0,
      totalLimit: 10000,
      issuedAt: new Date(),
    });
    console.log(`[SEED] Created new active card for: ${user.name}`);
  }

  console.log("\n=======================================================");
  console.log("Student Amit Sunda Ready:");
  console.log(`Name:        ${user.name}`);
  console.log(`Mobile:      ${user.mobile}`);
  console.log(`Email:       ${user.email}`);
  console.log(`Student ID:  ${user.studentId}`);
  console.log(`Sender Tag:  ${card.senderTag}`);
  console.log(`Card ID:     ${card.cardId}`);
  console.log(`Card Status: ${card.status}`);
  console.log(`KYC Status:  ${card.kycStatus}`);
  console.log(`Balance:     ₹${card.availableBalance} / ₹${card.totalLimit}`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seedAmit().catch((err) => {
  console.error("Seeding Amit failed:", err);
  process.exit(1);
});
