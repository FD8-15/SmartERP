import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getNextUserEmail } from "./helpers/user.js";

describe("POST /api/v1/users/register", () => {
  it("should register a new user", async () => {
    const email = getNextUserEmail();
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email: email,
        password: "password123"
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Success");
    expect(response.body.data.name).toBe("Test User");
    expect(response.body.data.email).toBe(email);
  });

  it("Should identify missing fields and fail validation", async () => {
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "",
        email: "",
        password: ""
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("Should not register duplicate email", async () => {
    const email = getNextUserEmail();
    const response1 = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email,
        password: "password123"
      });

    const response2 = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Another User",
        email,
        password: "password123"
      });
    expect(response1.status).toBe(201);
    expect(response2.status).toBe(400);
    expect(response2.body.message).toBe("User already registered");
  });
});

describe("POST /api/v1/users/login", () => {
  it("should login", async () => {
    const email = getNextUserEmail();
    const response1 = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email,
        password: "password123"
      });

    const response2 = await request(app)
      .post("/api/v1/users/login")
      .send({
        email,
        password: "password123"
      });

    expect(response1.status).toBe(201);
    expect(response1.body.data.email).toBe(response2.body.user.email);
    expect(response2.status).toBe(200);
    expect(response2.headers["set-cookie"].some(cookie => cookie.startsWith("accessToken="))).toBe(true);
    expect(response2.headers["set-cookie"].some(cookie => cookie.startsWith("refreshToken="))).toBe(true);
  });

  it("should return invalid user when email not found", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "nonexistent_user@example.com",
        password: "password123"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User email or password is invalid");
  });

  it("should identify wrong password in login", async () => {
    const email = getNextUserEmail();
    const response1 = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email,
        password: "password123"
      });

    const response2 = await request(app)
      .post("/api/v1/users/login")
      .send({
        email,
        password: "wrongpassword"
      });

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(400);
    expect(response2.body.message).toBe("User email or password is invalid");
  });

  it("should identify missing fields in login", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "",
        password: ""
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});

describe("POST /api/v1/users/logout", () => {
  let email;
  let cookies;
  beforeEach(async () => {
    email = getNextUserEmail();
    await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email,
        password: "password123"
      });

    const response2 = await request(app)
      .post("/api/v1/users/login")
      .send({
        email,
        password: "password123"
      });
    cookies = response2.headers["set-cookie"];
  });

  it("should logout successfully", async () => {
    const response = await request(app)
      .post("/api/v1/users/logout")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
  });

  it("should reject logout without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/users/logout");

    expect(response.status).toBe(401);
  });
});

describe("User Zod Validation Edge Cases", () => {
  it("should reject registration with invalid email format", async () => {
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email: "not-an-email",
        password: "password123"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject registration with password shorter than 6 characters", async () => {
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email: getNextUserEmail(),
        password: "123"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject registration with name shorter than 2 characters", async () => {
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "A",
        email: getNextUserEmail(),
        password: "password123"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject login with invalid email format", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "invalid-email-string",
        password: "password123"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject login when password is missing", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "valid@example.com"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});
