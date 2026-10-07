import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

async function seed() {
  console.log("Connecting to MongoDB:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  const mobile = "9352005086";
  const name = "Manish Kumar Bulchandani";
  const email = "manish@creativeupaay.com";
  const studentId = "APT-2026-MANISH";
  const senderTag = "131e1157-ac0f-4519-8fdb-f1068533cc09";
  const password = "Password@123";
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await User.findOne({
    $or: [{ studentId }, { mobile }],
  });

  if (!user) {
    user = await User.create({
      name,
      mobile,
      email,
      highestEducation: "Undergraduate / Bachelor's",
      city: "Jaipur",
      passwordHash,
      role: "student",
      userType: "aptech_student",
      studentId,
      isMobileVerified: true,
      isEmailVerified: true,
      status: "active",
    });
    console.log(`Created new verified student: ${user.name} (${user.mobile}), ID: ${user._id}`);
  } else {
    user.name = name;
    user.mobile = mobile;
    user.email = email;
    user.studentId = studentId;
    user.passwordHash = passwordHash;
    user.isMobileVerified = true;
    user.isEmailVerified = true;
    user.status = "active";
    user.userType = "aptech_student";
    await user.save();
    console.log(`Updated existing student: ${user.name} (${user.mobile}), ID: ${user._id}`);
  }

  // Ensure card has Full KYC and the verified senderTag
  let existingCard = await Card.findOne({ userId: user._id });
  if (existingCard) {
    existingCard.status = "ACTIVE";
    existingCard.cardType = "VIRTUAL";
    existingCard.kycStatus = "FULL_KYC";
    existingCard.senderTag = senderTag;
    existingCard.cardId = "1f25a738-a8d7-498d-a2b1-b137da99344b";
    existingCard.referenceId = "cd213e24-42b4-456f-bc60-8e63d9eb1fd5";
    existingCard.maskedPan = existingCard.maskedPan || "•••• •••• •••• 8942";
    existingCard.availableBalance = existingCard.availableBalance || 5000;
    existingCard.totalLimit = 200000;
    existingCard.isLocked = false;
    existingCard.isCardEnabled = true;
    await existingCard.save();
    console.log(`Updated card with FULL_KYC & senderTag for: ${user.name}`);
  } else {
    await Card.create({
      userId: user._id,
      status: "ACTIVE",
      cardType: "VIRTUAL",
      kycStatus: "FULL_KYC",
      senderTag,
      cardId: "1f25a738-a8d7-498d-a2b1-b137da99344b",
      referenceId: "cd213e24-42b4-456f-bc60-8e63d9eb1fd5",
      maskedPan: "•••• •••• •••• 8942",
      availableBalance: 5000,
      totalLimit: 200000,
      isLocked: false,
      isCardEnabled: true,
    });
    console.log(`Created new ACTIVE card with FULL_KYC for: ${user.name}`);
  }

  console.log("\n=======================================================");
  console.log("Verified TransBnk / ProConnect User Ready:");
  console.log(`Name:        ${user.name}`);
  console.log(`Mobile:      ${user.mobile}`);
  console.log(`Email:       ${user.email}`);
  console.log(`Student ID:  ${user.studentId}`);
  console.log(`Sender Tag:  ${senderTag}`);
  console.log(`KYC Status:  FULL_KYC`);
  console.log(`Card Status: ACTIVE`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
