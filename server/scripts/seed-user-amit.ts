import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

async function seed() {
  console.log("Connecting to MongoDB:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  const mobile = "8949006288";
  const name = "Amit Sunda";
  const email = "amit.sunda@example.com";
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

  // Ensure user does not have an issued card so that requirement #2 applies
  const existingCard = await Card.findOne({ userId: user._id });
  if (existingCard) {
    existingCard.status = "NOT_APPLIED";
    existingCard.cardId = null;
    existingCard.referenceId = null;
    existingCard.senderTag = null;
    existingCard.maskedPan = null;
    existingCard.availableBalance = 0;
    existingCard.totalLimit = 10000;
    await existingCard.save();
    console.log(`Reset card status to NOT_APPLIED for user: ${user.name}`);
  } else {
    await Card.create({
      userId: user._id,
      status: "NOT_APPLIED",
      cardType: "VIRTUAL",
      kycStatus: "MIN_KYC",
      availableBalance: 0,
      totalLimit: 10000,
    });
    console.log(`Created clean NOT_APPLIED card for user: ${user.name}`);
  }

  console.log("\n=======================================================");
  console.log("Mock User Ready:");
  console.log(`Name:        ${user.name}`);
  console.log(`Mobile:      ${user.mobile}`);
  console.log(`Email:       ${user.email}`);
  console.log(`Password:    ${password}`);
  console.log(`Student ID:  ${user.studentId}`);
  console.log(`Card Status: NOT_APPLIED (will redirect to /card/issuance)`);
  console.log("=======================================================\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
