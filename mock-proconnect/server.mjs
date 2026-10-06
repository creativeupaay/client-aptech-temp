import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5175;
const HOST = process.env.HOST || "0.0.0.0";
const HTML_FILE = path.join(__dirname, "index.html");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ============================================================================
// Mock Aptech Coin Ledger & API Storage (Single Source of Truth at Aptech)
// ============================================================================
const studentCoins = new Map([
  ["APT-2026-89490", 500],
  ["APT-2026-00417", 500],
  ["APT-2026-01554", 500],
  ["APT-2026-00892", 500],
  ["APT-2026-LIVE01", 500],
]);
const DEFAULT_COIN_BALANCE = 500;
const reversedTransactions = new Set();

function getStudentBalance(studentId) {
  const sid = studentId || "APT-2026-01554";
  if (!studentCoins.has(sid)) {
    studentCoins.set(sid, DEFAULT_COIN_BALANCE);
  }
  return studentCoins.get(sid);
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Allow cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-TBX-Client-Id, X-TBX-Client-Secret, X-Hubble-Secret, X-HubbleSecret");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const urlPath = parsedUrl.pathname;

  // ==========================================================================
  // APTECH COIN API ENDPOINTS (MOCKED FOR DEVELOPMENT)
  // ==========================================================================

  // 1. GET /api/v1/coins/balance?studentId=...
  if (urlPath === "/api/v1/coins/balance" && req.method === "GET") {
    const studentId = parsedUrl.searchParams.get("studentId") || "APT-2026-01554";
    const balance = getStudentBalance(studentId);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: "Student loyalty points balance retrieved successfully from Aptech",
        data: {
          studentId,
          balance,
          currency: "POINTS",
        },
      })
    );
    return;
  }

  // 2. POST /api/v1/coins/debit
  if (urlPath === "/api/v1/coins/debit" && req.method === "POST") {
    const body = await parseJsonBody(req);
    const studentId = body.studentId || "APT-2026-01554";
    const amount = Number(body.amount ?? body.coins ?? 0);
    const currentBalance = getStudentBalance(studentId);

    if (isNaN(amount) || amount <= 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          statusCode: 400,
          message: "Debit amount must be a positive number.",
        })
      );
      return;
    }

    if (currentBalance < amount) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          statusCode: 400,
          message: `Insufficient loyalty points balance. Available: ${currentBalance}, Required: ${amount}.`,
        })
      );
      return;
    }

    const remainingBalance = currentBalance - amount;
    studentCoins.set(studentId, remainingBalance);
    const transactionId = body.transactionId || `APTECH_TXN_${Date.now()}`;

    console.log(`[APTECH COIN API] Debited ${amount} points for student ${studentId}. Remaining: ${remainingBalance}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: "Coins debited successfully from Aptech Coin Ledger",
        data: {
          studentId,
          transactionId,
          referenceId: body.referenceId || transactionId,
          debitedAmount: amount,
          remainingBalance,
          currency: "POINTS",
        },
      })
    );
    return;
  }

  // 3. POST /api/v1/coins/reverse
  if (urlPath === "/api/v1/coins/reverse" && req.method === "POST") {
    const body = await parseJsonBody(req);
    const studentId = body.studentId || "APT-2026-01554";
    const amount = Number(body.amount ?? body.coins ?? 0);
    const currentBalance = getStudentBalance(studentId);
    const targetRef = body.originalTransactionId || body.referenceId || body.transactionId;

    if (targetRef && reversedTransactions.has(targetRef)) {
      console.log(`[APTECH COIN API] Idempotent reversal requested for ${targetRef}. Returning current balance (${currentBalance}).`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          statusCode: 200,
          message: "Transaction already reversed (idempotent response)",
          data: {
            studentId,
            transactionId: `APTECH_REV_IDEM_${targetRef}`,
            originalTransactionId: targetRef,
            refundedAmount: 0,
            newBalance: currentBalance,
            currency: "POINTS",
          },
        })
      );
      return;
    }

    if (targetRef) {
      reversedTransactions.add(targetRef);
    }

    const refundAmount = amount > 0 ? amount : 1;
    const newBalance = currentBalance + refundAmount;
    studentCoins.set(studentId, newBalance);

    const transactionId = `APTECH_REV_${Date.now()}`;
    console.log(`[APTECH COIN API] Reversed ${refundAmount} points for student ${studentId}. New Balance: ${newBalance}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: "Coins refunded/reversed successfully in Aptech Coin Ledger",
        data: {
          studentId,
          transactionId,
          originalTransactionId: targetRef,
          refundedAmount: refundAmount,
          newBalance,
          currency: "POINTS",
        },
      })
    );
    return;
  }

  // 4. POST /api/v1/coins/credit (Award/Add points)
  if (urlPath === "/api/v1/coins/credit" && req.method === "POST") {
    const body = await parseJsonBody(req);
    const studentId = body.studentId || "APT-2026-01554";
    const amount = Number(body.amount ?? body.coins ?? 0);
    const reason = body.reason || "Manual Credit / Course Reward";
    const currentBalance = getStudentBalance(studentId);

    if (isNaN(amount) || amount <= 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, statusCode: 400, message: "Credit amount must be positive." }));
      return;
    }

    const newBalance = currentBalance + amount;
    studentCoins.set(studentId, newBalance);
    console.log(`[APTECH COIN API] Credited ${amount} points to student ${studentId} (${reason}). New Balance: ${newBalance}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: `Credited ${amount} points successfully`,
        data: {
          studentId,
          creditedAmount: amount,
          newBalance,
          reason,
          currency: "POINTS",
        },
      })
    );
    return;
  }

  // 4b. POST /api/v1/cards/sync (Card Issuance Sync from TBX)
  if ((urlPath === "/api/v1/cards/sync" || urlPath === "/cards/sync") && req.method === "POST") {
    const body = await parseJsonBody(req);
    console.log(`[PROCONNECT] Received card sync: Student=${body.studentId}, Mobile=${body.mobileNumber}, Status=${body.cardStatus}, Last4=${body.last4Digits}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: "Student card details synchronized with ProConnect & ApTrack",
        data: body,
      })
    );
    return;
  }

  // 5. POST /api/v1/coins/set (Set exact points balance)
  if (urlPath === "/api/v1/coins/set" && req.method === "POST") {
    const body = await parseJsonBody(req);
    const studentId = body.studentId || "APT-2026-01554";
    const balance = Number(body.balance ?? 0);

    if (isNaN(balance) || balance < 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, statusCode: 400, message: "Balance must be a non-negative number." }));
      return;
    }

    studentCoins.set(studentId, balance);
    console.log(`[APTECH COIN API] Set balance for ${studentId} to ${balance}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        message: `Balance updated to ${balance} points`,
        data: {
          studentId,
          balance,
          currency: "POINTS",
        },
      })
    );
    return;
  }

  // 6. POST /api/v1/coins/reset
  if (urlPath === "/api/v1/coins/reset") {
    const body = req.method === "POST" ? await parseJsonBody(req) : {};
    const studentId = body.studentId || parsedUrl.searchParams.get("studentId");
    reversedTransactions.clear();
    if (studentId) {
      studentCoins.set(studentId, DEFAULT_COIN_BALANCE);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: `Reset ${studentId} balance to ${DEFAULT_COIN_BALANCE} points.` }));
      return;
    }
    studentCoins.clear();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, message: "All student coin balances reset to default (500)." }));
    return;
  }

  // Parse requested path for static file serving
  let filePath = path.join(__dirname, urlPath === "/" ? "index.html" : urlPath);

  // Security check: prevent directory traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  // Fallback to index.html for SPA or root access
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    filePath = HTML_FILE;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`500 Internal Server Error: ${err.message}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🎓 Aptech ProConnect Mock IdP Portal Active`);
  console.log(`📡 Local Portal URL:    http://localhost:${PORT}`);
  console.log(`🎯 Target TBX App:      http://localhost:5173`);
  console.log(`⚡ TBX Backend API:     http://localhost:8000`);
  console.log(`======================================================\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Please terminate any existing process on port ${PORT}.`);
  } else {
    console.error(`❌ Server error:`, err);
  }
});
