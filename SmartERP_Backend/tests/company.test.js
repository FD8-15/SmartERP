import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request, { cookies } from "supertest";
import app from "../src/app.js";

describe("POST /api/v1/company", () => {

    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/company")
        expect(response.status).toBe(401);
        console.log("Cannot create without login")
    });

});

describe("POST /api/v1/company", () => {

    let cookies;
    beforeEach(async () => {
        const email = `vitest_${Date.now()}@example.com`;

        await request(app)
            .post("/api/v1/users/register")
            .send({
                name: "Test User",
                email,
                password: "password123",
                role: "owner"
            });

        const response2 = await request(app)
            .post("/api/v1/users/login")
            .send({
                email,
                password: "password123"
            });

        cookies = response2.headers["set-cookie"];
    });

    it("should create a company", async () => {

        const companyName = `Test Company ${Date.now()}`;
        const response = await request(app)
            .post("/api/v1/company")
            .set("Cookie", cookies)
            .send({
                company_name: `Test Company ${Date.now()}`,
                email: `company_${Date.now()}@example.com`,
                address: "123 Test Street",
                contact_number: "9876543210",
                state: "Goa",
                gst_no: "30ABCDE1234F1Z5",
                financial_year_start: "2026-04-01",
                financial_year_end: "2027-03-31"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.resp.company_name).toBe(companyName);
        console.log("company created")
        console.log(response.body)
    });

});