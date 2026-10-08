import mongoose from "mongoose";
import { env } from "../src/env.config.js";
import { User } from "../src/modules/user/user.model.js";
import { Card } from "../src/modules/card/card.model.js";

import { DebitTransaction } from "../src/modules/hubble/debitTransaction.model.js";
import { VoucherRedemption } from "../src/modules/hubble/voucherRedemption.model.js";

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
  console.log("=== DEBIT TRANSACTIONS ===");
  const debits = await DebitTransaction.find({}).sort({ createdAt: -1 }).limit(5).lean();
  console.log(JSON.stringify(debits, null, 2));

  console.log("=== VOUCHER REDEMPTIONS ===");
  const vouchers = await VoucherRedemption.find({}).sort({ createdAt: -1 }).limit(5).lean();
  console.log(JSON.stringify(vouchers, null, 2));

  await mongoose.disconnect();
}
main().catch(console.error);
