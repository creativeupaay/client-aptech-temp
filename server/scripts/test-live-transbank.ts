import { HttpTransbankProvider } from "../src/services/transbank/providers/http.provider.js";

async function main() {
  const provider = new HttpTransbankProvider({
    baseUrl: "https://sandbox-api.trusthub.in",
    apiKey: "aEbRWf9z1F56N8LrnxEuu9MZ5sQknleCmQHSlHlj",
    clientId: "EXTCLT000454",
    username: "9306700469",
    clientPassword: "035950b0-dcaf-4f84-99be-1a23773f5e40",
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
