import { describe, expect, it } from "vitest";
import { ApiError } from "../src/utils/ApiError.js";
import {
  getTransbankErrorMapping,
  throwTransbankStatusError,
} from "../src/services/transbank/transbankErrorMap.js";
import { toPortalCardStatus, extractLast4 } from "../src/modules/card/cardStatusMapper.js";
import {
  getSenderTagPlain,
  setSenderTagEncrypted,
} from "../src/modules/card/senderTagCrypto.js";

describe("transbankErrorMap (ERR-01)", () => {
  it("maps cool-down message for load operations on code 5000", () => {
    const mapped = getTransbankErrorMapping(5000, "card loading is in cool down", {
      operation: "load",
    });
    expect(mapped.message).toContain("cool down");
    expect(mapped.retryable).toBe(true);
  });

  it("maps 4165 as conflict", () => {
    expect(() => throwTransbankStatusError(4165)).toThrow(ApiError);
    try {
      throwTransbankStatusError(4165);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(409);
    }
  });

  it("maps 4171 verification blocked", () => {
    const mapped = getTransbankErrorMapping(4171);
    expect(mapped.httpStatus).toBe(429);
    expect(mapped.message.toLowerCase()).toContain("blocked");
  });
});

describe("cardStatusMapper (ISS-05)", () => {
  it("maps internal statuses to portal vocabulary", () => {
    expect(toPortalCardStatus("ACTIVE")).toBe("Issued");
    expect(toPortalCardStatus("APPLICATION_PENDING")).toBe("Pending");
    expect(toPortalCardStatus("REJECTED")).toBe("Rejected");
    expect(toPortalCardStatus("NOT_APPLIED")).toBe("Not Issued");
  });

  it("does not invent last4 when masked pan missing", () => {
    expect(extractLast4(null)).toBeUndefined();
    expect(extractLast4("•••• •••• •••• 4019")).toBe("4019");
  });
});

describe("senderTagCrypto (SEC-01)", () => {
  it("encrypts and decrypts sender tags transparently", () => {
    const plain = "131e1157-ac0f-4519-8fdb-f1068533cc09";
    const encrypted = setSenderTagEncrypted(plain);
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    expect(getSenderTagPlain(encrypted)).toBe(plain);
    // Legacy plaintext passthrough
    expect(getSenderTagPlain(plain)).toBe(plain);
  });
});
