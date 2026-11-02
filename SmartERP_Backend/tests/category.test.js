import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createUserAndLogin } from "./helpers/user.js";
import { createCompany } from "./helpers/company.js";
import { createCategory, getNextCategoryName } from "./helpers/category.js";

describe("Category Endpoints and Validation", () => {
    let owner;
    let companyId;

    beforeAll(async () => {
        owner = await createUserAndLogin();
        const companyRes = await createCompany(owner.cookies, "CategoryTestCo");
        companyId = companyRes.body.data.resp.company_id;
    });

    describe("POST /api/v1/category/:company_id - Standard CRUD", () => {
        it("should create a category successfully with valid data", async () => {
            const catName = getNextCategoryName();
            const res = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: catName });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.category_name).toBe(catName);
        });

        it("should reject duplicate category name in the same company", async () => {
            const catName = getNextCategoryName();
            await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: catName });

            const duplicateRes = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: catName });

            expect(duplicateRes.status).toBe(409);
        });

        it("should allow same category name in a different company", async () => {
            const catName = getNextCategoryName();
            await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: catName });

            const comp2 = await createCompany(owner.cookies, "CategoryTestCo2");
            const comp2Id = comp2.body.data.resp.company_id;

            const res = await request(app)
                .post(`/api/v1/category/${comp2Id}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: catName });

            expect(res.status).toBe(201);
        });
    });

    describe("POST /api/v1/category/:company_id - Zod Validation", () => {
        it("should fail when category_name is missing", async () => {
            const res = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when category_name is empty string or only whitespace", async () => {
            const res = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "   " });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when category_name is less than 2 characters", async () => {
            const res = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "A" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when category_name exceeds 255 characters", async () => {
            const res = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "A".repeat(256) });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when category_name is not a string", async () => {
            const res = await request(app)
                .post(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: 12345 });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when company_id param is invalid", async () => {
            const res = await request(app)
                .post(`/api/v1/category/invalid-id`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "Valid Category" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when company_id param is negative or zero", async () => {
            const res = await request(app)
                .post(`/api/v1/category/-5`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "Valid Category" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("GET /api/v1/category/:company_id", () => {
        it("should fetch all categories for a company", async () => {
            const res = await request(app)
                .get(`/api/v1/category/${companyId}`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it("should fail validation when company_id is not a positive integer", async () => {
            const res = await request(app)
                .get(`/api/v1/category/abc`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("GET /api/v1/category/:company_id/:category_id", () => {
        let testCategoryId;

        beforeAll(async () => {
            const catRes = await createCategory(owner.cookies, companyId, getNextCategoryName());
            testCategoryId = catRes.body.data.category_id;
        });

        it("should fetch single category by ID", async () => {
            const res = await request(app)
                .get(`/api/v1/category/${companyId}/${testCategoryId}`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(200);
            expect(res.body.data.category_id).toBe(testCategoryId);
        });

        it("should return 404 for non-existent category", async () => {
            const res = await request(app)
                .get(`/api/v1/category/${companyId}/999999`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(404);
        });

        it("should fail validation when category_id is invalid", async () => {
            const res = await request(app)
                .get(`/api/v1/category/${companyId}/invalid`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("PATCH /api/v1/category/:company_id/:category_id", () => {
        let testCategoryId;

        beforeAll(async () => {
            const catRes = await createCategory(owner.cookies, companyId, getNextCategoryName());
            testCategoryId = catRes.body.data.category_id;
        });

        it("should update category name successfully", async () => {
            const newName = getNextCategoryName("UpdatedCat");
            const res = await request(app)
                .patch(`/api/v1/category/${companyId}/${testCategoryId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: newName });

            expect(res.status).toBe(200);
            expect(res.body.data.category_name).toBe(newName);
        });

        it("should fail when updating with missing category_name", async () => {
            const res = await request(app)
                .patch(`/api/v1/category/${companyId}/${testCategoryId}`)
                .set("Cookie", owner.cookies)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when updating with empty or whitespace category_name", async () => {
            const res = await request(app)
                .patch(`/api/v1/category/${companyId}/${testCategoryId}`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "   " });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail when updating with invalid category_id", async () => {
            const res = await request(app)
                .patch(`/api/v1/category/${companyId}/abc`)
                .set("Cookie", owner.cookies)
                .send({ category_name: "Valid Name" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("DELETE /api/v1/category/:company_id/:category_id", () => {
        it("should delete category successfully", async () => {
            const catRes = await createCategory(owner.cookies, companyId, getNextCategoryName());
            const catId = catRes.body.data.category_id;

            const res = await request(app)
                .delete(`/api/v1/category/${companyId}/${catId}`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(200);

            const getRes = await request(app)
                .get(`/api/v1/category/${companyId}/${catId}`)
                .set("Cookie", owner.cookies);
            expect(getRes.status).toBe(404);
        });

        it("should fail validation when deleting with invalid ID", async () => {
            const res = await request(app)
                .delete(`/api/v1/category/${companyId}/invalid`)
                .set("Cookie", owner.cookies);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });
});
