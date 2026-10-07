import mongoose from "mongoose";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

async function main() {
  await mongoose.connect(env.MONGO_URI);
  console.log("=== USERS IN DB ===");
  const users = await User.find({}).lean();
  for (const u of users) {
    console.log({
      id: u._id,
      name: u.name,
      mobile: u.mobile,
      email: u.email,
      studentId: u.studentId,
    });
  }
  console.log("=== CARDS IN DB ===");
  const cards = await Card.find({}).lean();
  for (const c of cards) {
    console.log({
      id: c._id,
      userId: c.userId,
      cardId: c.cardId,
      senderTag: c.senderTag,
      status: c.status,
      maskedPan: c.maskedPan,
      availableBalance: c.availableBalance,
    });
  }
  await mongoose.disconnect();
}
main().catch(console.error);
