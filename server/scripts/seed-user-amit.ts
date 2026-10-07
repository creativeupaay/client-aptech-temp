import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

async function seed() {
  console.log("Connecting to MongoDB:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  const mobile = "8233516296";
  const name = "Amit Sunda";
  const email = "amit.sunda14@example.com";
  const password = "Password@123";
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await User.findOne({ mobile });

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
      studentId: "APT-2026-89490",
      isMobileVerified: true,
      isEmailVerified: true,
      status: "active",
    });
    console.log(`Created new mock user: ${user.name} (${user.mobile}), ID: ${user._id}`);
  } else {
    user.name = name;
    user.email = email;
    user.passwordHash = passwordHash;
    user.isMobileVerified = true;
    user.status = "active";
    user.studentId = user.studentId || "APT-2026-89490";
    await user.save();
    console.log(`Updated existing user: ${user.name} (${user.mobile}), ID: ${user._id}`);
  }

  // Ensure user has the real active TransBnk card
  let existingCard = await Card.findOne({ userId: user._id });
  if (existingCard) {
    existingCard.status = "ACTIVE";
    existingCard.cardType = "VIRTUAL";
    existingCard.cardId = "81eff9ac-f1ce-4148-9f27-9f8971fca5e7";
    existingCard.referenceId = "57e03a3e-b016-46d8-8cdb-91ae70a51b0d";
    existingCard.senderTag = "dc22def0-1137-4063-be02-2243c72c0b11";
    existingCard.maskedPan = "•••• •••• •••• 8942";
    existingCard.availableBalance = existingCard.availableBalance || 0;
    existingCard.totalLimit = 10000;
    existingCard.isCardEnabled = true;
    existingCard.isLocked = false;
    await existingCard.save();
    console.log(`Linked active TransBnk card for user: ${user.name}`);
  } else {
    await Card.create({
      userId: user._id,
      status: "ACTIVE",
      cardType: "VIRTUAL",
      kycStatus: "MIN_KYC",
      cardId: "81eff9ac-f1ce-4148-9f27-9f8971fca5e7",
      referenceId: "57e03a3e-b016-46d8-8cdb-91ae70a51b0d",
      senderTag: "dc22def0-1137-4063-be02-2243c72c0b11",
      maskedPan: "•••• •••• •••• 8942",
      availableBalance: 0,
      totalLimit: 10000,
      isCardEnabled: true,
      isLocked: false,
    });
    console.log(`Created active card for user: ${user.name}`);
  }

  console.log("\n=======================================================");
  console.log("Mock User Ready:");
  console.log(`Name:        ${user.name}`);
  console.log(`Mobile:      ${user.mobile}`);
  console.log(`Email:       ${user.email}`);
  console.log(`Password:    ${password}`);
  console.log(`Student ID:  ${user.studentId}`);
  console.log(`Card ID:     81eff9ac-f1ce-4148-9f27-9f8971fca5e7`);
  console.log(`Card Status: ACTIVE`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
