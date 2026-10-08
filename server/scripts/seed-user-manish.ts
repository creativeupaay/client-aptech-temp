import mongoose from "mongoose";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

async function seedManish() {
  console.log("Connecting to MongoDB:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  const mobile = "9352005086";
  const name = "Manish Kumar Bulchandani";
  const email = "manish@creativeupaay.com";
  const studentId = "APT-2026-MANISH";
  const senderTag = "131e1157-ac0f-4519-8fdb-f1068533cc09";
  const cardId = "1f25a738-a8d7-498d-a2b1-b137da99344b";
  const referenceId = "cd213e24-42b4-456f-bc60-8e63d9eb1fd5";

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

  // Ensure card exists and has Full KYC
  let card = await Card.findOne({ userId: user._id });
  if (card) {
    card.status = "ACTIVE";
    card.cardType = "VIRTUAL";
    card.kycStatus = "FULL_KYC";
    card.senderTag = senderTag;
    card.cardId = cardId;
    card.referenceId = referenceId;
    card.maskedPan = "•••• •••• •••• 8942";
    card.availableBalance = 5000;
    card.usedAmount = 0;
    card.totalLimit = 200000;
    card.issuedAt = card.issuedAt || new Date();
    await card.save();
    console.log(`[SEED] Updated card with FULL_KYC for: ${user.name}`);
  } else {
    card = await Card.create({
      userId: user._id,
      status: "ACTIVE",
      cardType: "VIRTUAL",
      kycStatus: "FULL_KYC",
      senderTag,
      cardId,
      referenceId,
      maskedPan: "•••• •••• •••• 8942",
      availableBalance: 5000,
      usedAmount: 0,
      totalLimit: 200000,
      issuedAt: new Date(),
    });
    console.log(`[SEED] Created new active card with FULL_KYC for: ${user.name}`);
  }

  console.log("\n=======================================================");
  console.log("Student Manish Kumar Bulchandani Ready:");
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

seedManish().catch((err) => {
  console.error("Seeding Manish failed:", err);
  process.exit(1);
});
