import { CardSDK } from "../../client/node_modules/@oxymoney/cardsdk-web/dist/cardsdk.cjs.js";

async function getBearerToken() {
  const basicAuth = Buffer.from("EXTCLT000454:035950b0-dcaf-4f84-99be-1a23773f5e40").toString("base64");
  const params = new URLSearchParams({
    grant_type: "password",
    username: "9306700469",
    password: "035950b0-dcaf-4f84-99be-1a23773f5e40",
  });
  const res = await fetch("https://carduat.oxymoney.com/authserver/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function testTarget(baseUrl: string, clientToken: string, mobile: string, envName: "sandbox" | "production") {
  console.log(`\nTesting target=${baseUrl}, env=${envName}, mobile=${mobile}`);
  const sdk = new CardSDK({
    clientId: "EXTCLT000454",
    clientToken,
    environment: envName,
  });

  const opts = sdk.buildRequestOptions();
  opts.baseUrl = baseUrl;
  opts.authBaseUrl = baseUrl;

  try {
    const res = await (sdk as any).runOtpFlow(mobile);
    console.log("SUCCESS Result:", res);
  } catch (err: any) {
    console.log("FAILED Error:", err.message || err);
  }
}

async function main() {
  const bearerToken = await getBearerToken();
  console.log("Fetched live Bearer token:", bearerToken);

  const targets = [
    { url: "https://carduat.oxymoney.com", env: "sandbox" as const },
    { url: "https://carduat.oxymoney.com", env: "production" as const },
    { url: "https://gcdev.oxymoney.com", env: "sandbox" as const },
  ];

  const mobiles = ["8233516296", "9352005086", "8949006288"];

  for (const t of targets) {
    for (const m of mobiles) {
      await testTarget(t.url, bearerToken, m, t.env);
    }
  }
}

main().catch(console.error);
