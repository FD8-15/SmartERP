import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("POST /api/v1/users/register", () => {
  it("should register a new user", async () => {

    const email = `vitest_${Date.now()}@example.com`;

    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email: email,
        password: "password123",
        role: "employee"
      });

    console.log(response.body);

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Success");

    expect(response.body.data.name).toBe("Test User");
    expect(response.body.data.email).toBe(email);
    expect(response.body.data.role).toBe("employee");
  });
});

describe("POST /api/v1/users/register", () => {
  it("Should identify missing feilds", async () => {

    const response = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "",
        email: "",
        password: "",
        role: ""
      })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("All fields are required")
  })
})

describe("POST /api/v1/users/register", () => {
  it("Should not registster duplicate email", async () => {
    const email = `vitest_${Date.now()}@example.com`;
    const response1 = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Test User",
        email,
        password: "password123",
        role: "employee"
      });

    const response2 = await request(app)
      .post("/api/v1/users/register")
      .send({
        name: "Another User",
        email,
        password: "password123",
        role: "employee"
      });

    expect(response1.status).toBe(201);

    expect(response2.status).toBe(400);
    expect(response2.body.message).toBe("User already registered");
  })
})