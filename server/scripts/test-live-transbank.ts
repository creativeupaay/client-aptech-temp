import { HttpTransbankProvider } from "../src/services/transbank/providers/http.provider.js";
import { env } from "../src/env.config.js";

async function main() {
  const provider = new HttpTransbankProvider({
    baseUrl: env.TRANSBNK_BASE_URL,
    apiKey: env.TRANSBNK_API_KEY,
    clientId: env.TRANSBNK_CLIENT_ID,
    username: env.TRANSBNK_USERNAME,
    clientPassword: env.TRANSBNK_CLIENT_PASSWORD,
  });

  console.log("--------------------------------------------------");
  console.log("Testing Live TransBnk Gateway (IP Whitelisting Removed)");
  console.log("--------------------------------------------------");

  try {
    console.log("Calling sendCustomerOtp for mobile 9306700469...");
    const otpRes = await provider.sendCustomerOtp({ mobile: "9306700469" });
    console.log("OTP Response:", otpRes);
  } catch (err) {
    console.error("sendCustomerOtp failed:", err);
  }
}

main();
