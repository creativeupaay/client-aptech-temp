import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Local development mock proxy plugin for @oxymoney/cardsdk-web.
 * Resolves sandbox authentication, unmasked card reveal, CVV reveal, and PIN management
 * without being blocked by remote OxyMoney merchant whitelisting.
 */
function cardSdkDevPlugin(): Plugin {
  return {
    name: "card-sdk-dev-mock-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];

        // 1. Authserver: Generate Login OTP
        if (url === "/authserver/generate/login/otp") {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "OTP sent successfully" },
              message: "OTP sent successfully",
            })
          );
        }

        // 2. Authserver: Verify Login OTP & Issue Client Token
        if (url === "/authserver/client/token") {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "OTP verified successfully" },
              access_token: "cardsdk_dev_session_token_" + Date.now(),
            })
          );
        }

        // 3. Unmasked Card Details
        if (
          url === "/ag/uiObjects/sender-endpoint/v1/card/unmasked" ||
          url === "/uiObjects/sender-endpoint/v1/card/unmasked"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Card details retrieved successfully" },
              card_number: "6074218942918942",
              card_no: "6074218942918942",
              expiry_date: "10/30",
              expiry: "10/31",
              cvv: "844",
              name: "Amit Sunda",
              card_status: "ACTIVE",
              data: {
                card_number: "6074218942918942",
                card_no: "6074218942918942",
                expiry_date: "10/30",
                expiry: "10/30",
                cvv: "842",
                name: "Amit Sunda",
                card_status: "ACTIVE",
              },
            })
          );
        }

        // 4. CVV Reveal
        if (
          url === "/ag/retube/sender-endpoint/v1/card/cvv" ||
          url === "/retube/sender-endpoint/v1/card/cvv"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "CVV revealed" },
              cvv: "844",
              data: {
                cvv: "844",
              },
            })
          );
        }

        // 5. PIN Setup
        if (
          url === "/ag/retube/sender-endpoint/v1/card/management/set/pin" ||
          url === "/retube/sender-endpoint/v1/card/management/set/pin"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Card PIN set successfully." },
              data: {
                message: "Card PIN set successfully.",
              },
            })
          );
        }

        // 6. Channel Controls (ECOM, POS, ATM, CONTACTLESS)
        if (
          url === "/ag/retube/sender-endpoint/v1/card/management/get/card/channel" ||
          url === "/retube/sender-endpoint/v1/card/management/get/card/channel"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Channels loaded" },
              ecom: "ENABLED",
              pos: "ENABLED",
              atm: "DISABLED",
              data: {
                ecom: "ENABLED",
                pos: "ENABLED",
                atm: "DISABLED",
              },
            })
          );
        }

        // 7. Channel Update
        if (
          url === "/ag/retube/sender-endpoint/v1/card/management/update/card/channel" ||
          url === "/retube/sender-endpoint/v1/card/management/update/card/channel"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Channel preferences updated" },
              data: { message: "Saved" },
            })
          );
        }

        // 8. Card Status (Pause / Activate)
        if (
          url === "/ag/retube/sender-endpoint/v1/card/management/set/card/status" ||
          url === "/retube/sender-endpoint/v1/card/management/set/card/status"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Card status updated" },
              data: { message: "Status updated" },
            })
          );
        }

        // 9. Card Lock / Block
        if (
          url === "/ag/retube/sender-endpoint/v1/card/management/block/card" ||
          url === "/retube/sender-endpoint/v1/card/management/block/card"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Card lock state updated" },
              data: { message: "Card locked" },
            })
          );
        }

        // 10. Wallet Balance
        if (
          url === "/ag/wallet/sender-endpoint/v1/balance" ||
          url === "/wallet/sender-endpoint/v1/balance"
        ) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Balance retrieved" },
              balance: 10000,
              data: { balance: 10000 },
            })
          );
        }

        // 11. Transaction Reports
        if (url.includes("/report/sender_endpoint/v1/report/execute")) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Report generated" },
              data: ["mock_report_key_001"],
            })
          );
        }

        if (url.includes("/report/sender_endpoint/v1/report/status")) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "SUCCESS" },
              data: { status: "SUCCESS" },
            })
          );
        }

        if (url.includes("/report/sender_endpoint/v1/report/page")) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: { code: 2000, message: "Transactions" },
              data: [],
            })
          );
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useRemoteOxySandbox = env.VITE_USE_REMOTE_OXY_SANDBOX === "true";
  const remoteHost = env.VITE_OXY_SANDBOX_HOST || "https://carduat.oxymoney.com";

  if (useRemoteOxySandbox) {
    console.log(` [Vite Proxy] Routing /ag and /authserver to remote sandbox: ${remoteHost}`);
  } else {
    console.log(" [Vite Proxy] Using local dev mock proxy plugin for @oxymoney/cardsdk-web");
  }

  return {
    plugins: [
      tailwindcss(),
      react(),
      ...(useRemoteOxySandbox ? [] : [cardSdkDevPlugin()]),
    ],

    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        ...(useRemoteOxySandbox
          ? {
              "/ag": {
                target: remoteHost,
                changeOrigin: true,
                secure: false,
                timeout: 35000,
              },
              "/authserver": {
                target: remoteHost,
                changeOrigin: true,
                secure: false,
                timeout: 35000,
              },
            }
          : {}),
      },
    },
  };
});

