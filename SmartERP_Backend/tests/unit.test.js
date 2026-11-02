import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createUserAndLogin } from "./helpers/user.js";
import { createCompany } from "./helpers/company.js";
import { createUnit, getNextUnitName } from "./helpers/unit.js";

describe("Unit Endpoints and Validation", () => {
    let owner;
    let companyId;

    beforeAll(async () => {
        owner = await createUserAndLogin();
        const companyRes = await createCompany(owner.cookies, "UnitTestCo");
        companyId = companyRes.body.data.resp.company_id;
    });

    describe("POST /api/v1/unit/:company_id - Standard CRUD", () => {
        it("should create a unit successfully with valid data", async () => {
            const unitName = getNextUnitName();
            const res = await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: unitName });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.unit_name).toBe(unitName);
        });

        it("should reject duplicate unit name in the same company", async () => {
            const unitName = getNextUnitName();
            await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: unitName });

            const duplicateRes = await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: unitName });

            expect(duplicateRes.status).toBe(409);
        });

        it("should allow same unit name in a different company", async () => {
            const unitName = getNextUnitName();
            await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: unitName });

            const comp2 = await createCompany(owner.cookies, "UnitTestCo2");
            const comp2Id = comp2.body.data.resp.company_id;

            const res = await request(app)
                .post(`/api/v1/unit/${comp2Id}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: unitName });

            expect(res.status).toBe(201);
        });
    });

    describe("POST /api/v1/unit/:company_id - Zod Validation", () => {
        it("should fail when unit_name is missing", async () => {
            const res = await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when unit_name is empty string or only whitespace", async () => {
            const res = await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: "   " });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when unit_name exceeds 50 characters", async () => {
            const res = await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: "U".repeat(51) });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when unit_name is not a string", async () => {
            const res = await request(app)
                .post(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: 999 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when company_id param is invalid", async () => {
            const res = await request(app)
                .post(`/api/v1/unit/invalid-id`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: "Valid Unit" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when company_id param is negative or zero", async () => {
            const res = await request(app)
                .post(`/api/v1/unit/-10`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: "Valid Unit" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("GET /api/v1/unit/:company_id", () => {
        it("should fetch all units for a company", async () => {
            const res = await request(app)
                .get(`/api/v1/unit/${companyId}`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it("should fail validation when company_id is not a positive integer", async () => {
            const res = await request(app)
                .get(`/api/v1/unit/abc`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("GET /api/v1/unit/:company_id/:unit_id", () => {
        let testUnitId;

        beforeAll(async () => {
            const unitRes = await createUnit(owner.cookies, companyId, getNextUnitName());
            testUnitId = unitRes.body.data.unit_id;
        });

        it("should fetch single unit by ID", async () => {
            const res = await request(app)
                .get(`/api/v1/unit/${companyId}/${testUnitId}`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(200);
            expect(res.body.data.unit_id).toBe(testUnitId);
        });

        it("should return 404 for non-existent unit", async () => {
            const res = await request(app)
                .get(`/api/v1/unit/${companyId}/999999`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(404);
        });

        it("should fail validation when unit_id is invalid", async () => {
            const res = await request(app)
                .get(`/api/v1/unit/${companyId}/invalid`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("PATCH /api/v1/unit/:company_id/:unit_id", () => {
        let testUnitId;

        beforeAll(async () => {
            const unitRes = await createUnit(owner.cookies, companyId, getNextUnitName());
            testUnitId = unitRes.body.data.unit_id;
        });

        it("should update unit name successfully", async () => {
            const newName = getNextUnitName("UpdatedUnit");
            const res = await request(app)
                .patch(`/api/v1/unit/${companyId}/${testUnitId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: newName });

            expect(res.status).toBe(200);
            expect(res.body.data.unit_name).toBe(newName);
        });

        it("should fail when updating with missing unit_name", async () => {
            const res = await request(app)
                .patch(`/api/v1/unit/${companyId}/${testUnitId}`)
                .set("Cookie", owner.cookies)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when updating with empty or whitespace unit_name", async () => {
            const res = await request(app)
                .patch(`/api/v1/unit/${companyId}/${testUnitId}`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: "   " });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when updating with invalid unit_id", async () => {
            const res = await request(app)
                .patch(`/api/v1/unit/${companyId}/abc`)
                .set("Cookie", owner.cookies)
                .send({ unit_name: "Valid Unit" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });
});
