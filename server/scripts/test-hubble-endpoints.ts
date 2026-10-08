/**
 * Hubble Money Automated Coin API Verification Test Script
 *
 * Simulates Hubble Cloud's automated test runner for:
 * 1. POST /api/v1/hubble/sso      (Classic SSO token validation)
 * 2. POST /api/v1/hubble/balance  (Loyalty Points check)
 * 3. POST /api/v1/hubble/debit    (Points deduction upon voucher purchase)
 * 4. POST /api/v1/hubble/reverse  (Points refund upon transaction rollback)
 *
 * Run with:
 *   npx tsx --env-file=.env scripts/test-hubble-endpoints.ts
 */

import jwt from "jsonwebtoken";

const API_BASE = process.env.TEST_API_URL || "http://localhost:8000/api/v1/hubble";
const HUBBLE_SECRET = process.env.HUBBLE_WEBHOOK_SECRET || "mock_hubble_secret_2026";
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "tbx_access_secret_key_super_secure_2026";

interface TestResponse<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  data: T;
}

async function runHubbleVerification() {
  console.log("\n============================================================");
  console.log("🚀 Running Hubble Money Automated Verification Suite");
  console.log(`📡 Target API: ${API_BASE}`);
  console.log("============================================================\n");

  let passedTests = 0;
  const totalTests = 5;

  // --------------------------------------------------------------------------
  // TEST 1: Classic SSO Token Exchange
  // --------------------------------------------------------------------------
  console.log("▶ [1/5] Testing Classic SSO (/sso)...");
  try {
    // Dynamically provision / find an active student via SSO simulate & exchange
    const simRes = await fetch("http://localhost:8000/api/v1/auth/sso/simulate-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sneha Patel",
        studentId: "APT-2026-01554",
        mobile: "9123456789",
      }),
    });
    const simJson = await simRes.json();
    const authCode = simJson.data.code;

    const exchangeRes = await fetch("http://localhost:8000/api/v1/auth/sso/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: authCode }),
    });
    const exchangeJson = await exchangeRes.json();
    const currentStudentId = exchangeJson.data.user.studentId;
    const currentUserId = exchangeJson.data.user.id;

    const testToken = jwt.sign(
      {
        id: currentUserId,
        userId: currentUserId,
        studentId: currentStudentId,
        phoneNumber: "9123456789",
        name: "Sneha Patel",
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const ssoRes = await fetch(`${API_BASE}/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hubble-Secret": HUBBLE_SECRET,
      },
      body: JSON.stringify({ token: testToken }),
    });

    const ssoJson = (await ssoRes.json()) as TestResponse<{
      userId: string;
      studentId: string;
      name: string;
      email: string;
      loyaltyPoints: number;
    }>;

    if (!ssoRes.ok || !ssoJson.success) {
      throw new Error(`SSO failed: ${ssoJson.message || ssoRes.statusText}`);
    }

    console.log(`   ✅ SSO Verified! Student: ${ssoJson.data.name} (${ssoJson.data.studentId})`);
    console.log(`   User ID: ${ssoJson.data.userId}`);
    passedTests++;

    const userId = ssoJson.data.userId;

    // ------------------------------------------------------------------------
    // TEST 2: Balance API
    // ------------------------------------------------------------------------
    console.log("\n▶ [2/5] Testing Balance API (/balance)...");
    const balRes = await fetch(`${API_BASE}/balance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hubble-Secret": HUBBLE_SECRET,
      },
      body: JSON.stringify({ userId }),
    });

    const balJson = (await balRes.json()) as TestResponse<{
      balance: number;
      currency: string;
    }>;

    if (!balRes.ok || !balJson.success) {
      throw new Error(`Balance check failed: ${balJson.message || balRes.statusText}`);
    }

    const initialBalance = balJson.data.balance;
    console.log(`   ✅ Balance API Verified! Available Points: ${initialBalance} ${balJson.data.currency}`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 3: Debit Coins API
    // ------------------------------------------------------------------------
    const debitAmount = 100;
    const testTxnId = `TEST_TXN_${Date.now()}`;
    console.log(`\n▶ [3/5] Testing Debit Coins API (/debit) for ${debitAmount} Points...`);

    const debitRes = await fetch(`${API_BASE}/debit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hubble-Secret": HUBBLE_SECRET,
      },
      body: JSON.stringify({
        userId,
        amount: debitAmount,
        transactionId: testTxnId,
        brandName: "IKEA Gift Voucher",
        orderId: `ORD_${Date.now()}`,
      }),
    });

    const debitJson = (await debitRes.json()) as TestResponse<{
      transactionId: string;
      debitedAmount: number;
      remainingBalance: number;
    }>;

    if (!debitRes.ok || !debitJson.success) {
      throw new Error(`Debit failed: ${debitJson.message || debitRes.statusText}`);
    }

    console.log(`   ✅ Debit API Verified! TXN: ${debitJson.data.transactionId}`);
    console.log(`   Previous: ${initialBalance} | Debited: ${debitAmount} | Remaining: ${debitJson.data.remainingBalance}`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 4: Reverse Debit API
    // ------------------------------------------------------------------------
    console.log(`\n▶ [4/5] Testing Reverse Debit API (/reverse) for TXN ${testTxnId}...`);
    const revRes = await fetch(`${API_BASE}/reverse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hubble-Secret": HUBBLE_SECRET,
      },
      body: JSON.stringify({
        userId,
        amount: debitAmount,
        originalTransactionId: testTxnId,
        reason: "Test rollback simulation",
      }),
    });

    const revJson = (await revRes.json()) as TestResponse<{
      transactionId: string;
      refundedAmount: number;
      newBalance: number;
    }>;

    if (!revRes.ok || !revJson.success) {
      throw new Error(`Reverse failed: ${revJson.message || revRes.statusText}`);
    }

    console.log(`   ✅ Reverse API Verified! Reversal TXN: ${revJson.data.transactionId}`);
    console.log(`   Refunded: ${revJson.data.refundedAmount} | Restored Balance: ${revJson.data.newBalance}`);
    passedTests++;

    // ------------------------------------------------------------------------
    // TEST 5: Insufficient Balance Edge Case
    // ------------------------------------------------------------------------
    console.log("\n▶ [5/5] Testing Insufficient Balance Protection...");
    const overDebitRes = await fetch(`${API_BASE}/debit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hubble-Secret": HUBBLE_SECRET,
      },
      body: JSON.stringify({
        userId,
        amount: 999999999, // Excessively large amount
      }),
    });

    if (overDebitRes.status === 400) {
      const errJson = (await overDebitRes.json()) as { message?: string };
      console.log(`   ✅ Overspending Safely Rejected (Status: 400 Bad Request)`);
      console.log(`   Reason: "${errJson.message}"`);
      passedTests++;
    } else {
      console.warn(`   ⚠️ Expected status 400, received: ${overDebitRes.status}`);
    }

  } catch (err: unknown) {
    console.error(`\n❌ Test failed:`, err instanceof Error ? err.message : err);
  }

  console.log("\n============================================================");
  if (passedTests === totalTests) {
    console.log(`🎉 ALL ${totalTests}/${totalTests} HUBBLE VERIFICATION TESTS PASSED!`);
    console.log("   Ready to enable 'Coins Enabled' in Hubble Money Dashboard.");
  } else {
    console.log(`⚠️ ${passedTests}/${totalTests} tests passed. Please review logs above.`);
  }
  console.log("============================================================\n");
}

runHubbleVerification();
