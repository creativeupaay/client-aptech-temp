import nodeForge from "../../client/node_modules/node-forge/lib/index.js";

const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtEyufpsf2vVNuJWWvzxF
lOh4VKkp8crGtVcSbBGwrze3FQionmIjjqCzZJ6kkCYZwi4ASoNCMNr81/jdxxV6
PuB8ltA8AUlULUEb63DWUzEdaI1LdXAIJyM6OmtdHtakKAJ78EJ04GzqR+Q+29cT
GBy/n8nmMg5Lw1GJ78cmeAzG8fNHsZyhk+di50DiPDPE8xFKDf1bEFfwS28EYmtA
EX3Q6ezaPMnsVEN/thDbj4IXmh2xIWjC7WLYQXhMVGnoPGtmONtzd2s+TO6xfJyY
+7vQciAJHgukY27JspNdBP154Bwi9vti7OSqeJrF2knQ98S+GJdSYpARaqXk2lrZ
ewIDAQAB
-----END PUBLIC KEY-----`;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTimestamp(d = new Date()) {
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${pad(d.getFullYear() % 100)}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function sha256Hex(str: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptPayload(payload: any) {
  const aesKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(aesKeyBytes);

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const keyHash = await crypto.subtle.digest("SHA-256", aesKeyBytes.buffer);
  const derivedKeyBytes = new Uint8Array(keyHash).slice(0, 16);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    derivedKeyBytes.buffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    plaintext.buffer
  );

  const combined = new Uint8Array(12 + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), 12);
  const data = Buffer.from(combined).toString("base64");

  const pubKey = nodeForge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedKey = pubKey.encrypt(
    nodeForge.util.createBuffer(Buffer.from(aesKeyBytes).toString("binary")).data,
    "RSAES-PKCS1-V1_5"
  );
  const key = nodeForge.util.encode64(encryptedKey);

  return { data, key };
}

async function testOtpRequest(clientId: string, clientToken: string, mobile: string) {
  const ts = getTimestamp();
  const checksum = await sha256Hex(`${mobile}:USER_VERIFICATION:${clientToken}:${ts}`);
  const payload = {
    mobile,
    purpose: "USER_VERIFICATION",
    checksum,
  };

  const encrypted = await encryptPayload(payload);

  const res = await fetch("https://carduat.oxymoney.com/authserver/generate/login/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client-id": clientId,
      "X-SDK-Platform": "web",
      Authorization: `Bearer ${clientToken}`,
    },
    redirect: "manual",
    body: JSON.stringify(encrypted),
  });

  const text = await res.text();
  console.log(`[HTTP ${res.status}] clientId=${clientId} mobile=${mobile} location=${res.headers.get("location")}`);
  console.log("Response:", text);
}

async function main() {
  const clientIds = ["EXTCLT000454", "9306700469"];
  const tokens = [
    "035950b0-dcaf-4f84-99be-1a23773f5e40",
  ];
  const mobiles = ["8233516296", "9352005086", "9793672985", "9306700469", "9004107216", "9876543210"];

  for (const cId of clientIds) {
    for (const tok of tokens) {
      for (const mob of mobiles) {
        await testOtpRequest(cId, tok, mob);
      }
    }
  }
}

main().catch(console.error);
