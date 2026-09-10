import { describe, it, expect } from "vitest";
import request, { cookies } from "supertest";
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

describe("POST /api/v1/users/login", () => {
  it("should login ", async () => {

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
      .post("/api/v1/users/login")
      .send({
        email,
        password: "password123"
      });

    expect(response1.status).toBe(201)
    expect(response1.body.data.email).toBe(response2.body.user.email);
    expect(response2.status).toBe(200);
    console.log(response2.headers);
    expect(response2.headers["set-cookie"].some(cookie => cookie.startsWith("accessToken="))).toBe(true);
    expect(response2.headers["set-cookie"].some(cookie => cookie.startsWith("refreshToken="))).toBe(true);
    console.log(response2.body);
    console.log("Login test successful");


  })
})

describe("POST /api/v1/users/login", () => {

  it("should email not found", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "Raj",
        password: "password123"
      });

    expect(response.status).toBe(400)
    expect(response.body.message).toBe("User email or password is invalid")
    console.log(response.body);
    console.log("test email not found successful");

  })
})

describe("POST /api/v1/users/login", () => {
  it("should identify wrong password in login", async () => {
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
      .post("/api/v1/users/login")
      .send({
        email,
        password: "password"
      });

    expect(response1.status).toBe(201)
    expect(response2.status).toBe(400);
    expect(response2.body.message).toBe("User email or password is invalid")
    console.log(response2.body);
    console.log("incorrect password test successful");
  })
})


describe("POST /api/v1/users/login", () => {
  it("should identify missing feilds ", async () => {

    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "",
        password: ""
      });
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("All fields are required");
    console.log(response.body.message)
    console.log("Login missing feild test successful");
  })
})

