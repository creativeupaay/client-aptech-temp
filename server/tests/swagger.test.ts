import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getFilteredSwaggerDocument, EXCLUDED_STUDENT_PATHS, resolveDocsAudience } from "../src/docs/swagger.js";

describe("Swagger Documentation & OpenAPI Spec Endpoints (Option 1 Filtering)", () => {
  it("resolveDocsAudience derives audience from NODE_ENV", () => {
    expect(resolveDocsAudience("production")).toBe("student_production");
    expect(resolveDocsAudience("development")).toBe("internal_full");
    expect(resolveDocsAudience("test")).toBe("internal_full");
    // Explicit override takes precedence
    expect(resolveDocsAudience("production", "internal_full")).toBe("internal_full");
    expect(resolveDocsAudience("development", "student_production")).toBe("student_production");
  });

  it("should serve default OpenAPI specification at GET /api-docs.json matching NODE_ENV", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    // In test environment (NODE_ENV !== production), default serves internal_full
    expect(res.body.paths["/auth/sso/simulate-code"]).toBeDefined();
  });
  it("should serve student_production OpenAPI specification at GET /api-docs.json with audience=student_production", async () => {
    const res = await request(app).get("/api-docs.json?audience=student_production");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("AP-Tech (TBX) Banking & Card Platform API");
    expect(res.body.paths).toBeDefined();

    // Required Student & SSO endpoints MUST be present
    expect(res.body.paths["/auth/sso/exchange"]).toBeDefined();
    expect(res.body.paths["/auth/refresh"]).toBeDefined();
    expect(res.body.paths["/auth/logout"]).toBeDefined();
    expect(res.body.paths["/auth/me"]).toBeDefined();

    // Card and Hubble endpoints MUST be present
    expect(res.body.paths["/card/register-and-issue"]).toBeDefined();
    expect(res.body.paths["/card/sdk-session"]).toBeDefined();
    expect(res.body.paths["/hubble/launch-url"]).toBeDefined();
    expect(res.body.paths["/hubble/balance"]).toBeDefined();

    // Non-student auth and Mock endpoints MUST NOT be present
    for (const path of EXCLUDED_STUDENT_PATHS) {
      expect(res.body.paths[path]).toBeUndefined();
    }

    // Schemas used only by excluded endpoints must be cleaned up
    expect(res.body.components.schemas.SignupRequest).toBeUndefined();
    expect(res.body.components.schemas.VerifyOtpRequest).toBeUndefined();
    expect(res.body.components.schemas.LoginRequest).toBeUndefined();
    expect(res.body.components.schemas.SsoExchangeRequest).toBeDefined();
  });

  it("should serve internal_full OpenAPI specification when query parameter ?audience=internal_full is supplied", async () => {
    const res = await request(app).get("/api-docs.json?audience=internal_full");

    expect(res.status).toBe(200);
    expect(res.body.paths).toBeDefined();

    // In internal_full, internal test routes like simulate-code and mock KYC are present
    expect(res.body.paths["/auth/sso/simulate-code"]).toBeDefined();
    expect(res.body.paths["/card/mock-complete-kyc"]).toBeDefined();
    expect(res.body.components.schemas.SsoExchangeRequest).toBeDefined();
  });
});

