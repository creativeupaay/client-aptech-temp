import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getFilteredSwaggerDocument, EXCLUDED_STUDENT_PATHS } from "../src/docs/swagger.js";

describe("Swagger Documentation & OpenAPI Spec Endpoints (Option 1 Filtering)", () => {
  it("should serve student_production OpenAPI specification at GET /api-docs.json by default", async () => {
    const res = await request(app).get("/api-docs.json");

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

    // In internal_full, all paths including mocks and signup must be present
    expect(res.body.paths["/auth/signup"]).toBeDefined();
    expect(res.body.paths["/auth/login"]).toBeDefined();
    expect(res.body.paths["/auth/sso/simulate-code"]).toBeDefined();
    expect(res.body.paths["/card/mock-complete-kyc"]).toBeDefined();
    expect(res.body.components.schemas.SignupRequest).toBeDefined();
  });

  it("getFilteredSwaggerDocument unit test verifies path count differences", () => {
    const studentDoc = getFilteredSwaggerDocument("student_production");
    const internalDoc = getFilteredSwaggerDocument("internal_full");

    const studentPaths = Object.keys(studentDoc.paths);
    const internalPaths = Object.keys(internalDoc.paths);

    expect(internalPaths.length).toBeGreaterThan(studentPaths.length);
    expect(internalPaths.length - studentPaths.length).toBe(EXCLUDED_STUDENT_PATHS.length);

    expect(studentDoc.paths["/auth/signup"]).toBeUndefined();
    expect(internalDoc.paths["/auth/signup"]).toBeDefined();
  });

  it("should redirect GET /docs to /api-docs", async () => {
    const res = await request(app).get("/docs");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/api-docs");
  });

  it("should serve Swagger UI at GET /api-docs/", async () => {
    const res = await request(app).get("/api-docs/");
    expect([200, 301, 302]).toContain(res.status);
  });
});
