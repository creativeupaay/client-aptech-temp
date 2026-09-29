import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

describe("Base API & Database Setup", () => {
  it("should return 200 OK from the /health check endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "healthy");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
  });

  it("should return 200 OK from /api/v1/status endpoint with structured envelope", async () => {
    const response = await request(app).get("/api/v1/status");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "API v1 operational");
    expect(response.body.data).toHaveProperty("status", "online");
  });

  it("should return 404 with structured ApiError format for unknown routes", async () => {
    const response = await request(app).get("/api/v1/non-existent-route");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body.message).toContain("Cannot GET /api/v1/non-existent-route");
  });

  it("should verify in-memory database operations are functional and isolated", async () => {
    const SampleSchema = new mongoose.Schema({ name: String });
    const SampleModel = mongoose.models.Sample || mongoose.model("Sample", SampleSchema);

    const doc = await SampleModel.create({ name: "Testing Isolation" });
    expect(doc._id).toBeDefined();

    const found = await SampleModel.findById(doc._id);
    expect(found?.name).toBe("Testing Isolation");
  });
});
