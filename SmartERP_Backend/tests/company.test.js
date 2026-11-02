import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("POST /api/v1/company", () => {
    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/company");
        expect(response.status).toBe(401);
        console.log("Cannot create without login");
    });
});

let testCompanyCounter = 1;
function getTestCompanyName(prefix = "Test Company") {
    return `${prefix}_${testCompanyCounter++}_${Date.now()}`;
}

async function createCompany(cookies, companyName) {
    const name = companyName || getTestCompanyName();
    const response = await request(app)
        .post("/api/v1/company")
        .set("Cookie", cookies)
        .send({
            company_name: name,
            email: `company_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
            address: "123 Test Street",
            contact_number: "9876543210",
            state: "Goa",
            gst_no: "30ABCDE1234F1Z5",
            financial_year_start: "2026-04-01",
            financial_year_end: "2027-03-31"
        });

    return response;
}

async function createUserAndLogin() {
    let cookies;
    const email = `vitest_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
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

    return { cookies, email };
}

describe("POST /api/v1/company", () => {
    let cookies;

    beforeEach(async () => {
        const user = await createUserAndLogin();
        cookies = user.cookies;
    });

    it("should create a company", async () => {
        const companyName = getTestCompanyName();
        const response = await request(app)
            .post("/api/v1/company")
            .set("Cookie", cookies)
            .send({
                company_name: companyName,
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
        console.log("company created");
        console.log(response.body);
    });

    it("should reject create company more then 5 times with same user", async () => {
        await createCompany(cookies, getTestCompanyName("co1"));
        await createCompany(cookies, getTestCompanyName("co2"));
        await createCompany(cookies, getTestCompanyName("co3"));
        await createCompany(cookies, getTestCompanyName("co4"));
        await createCompany(cookies, getTestCompanyName("co5"));
        const response3 = await createCompany(cookies, getTestCompanyName("co6"));

        expect(response3.status).toBe(400);
        console.log(response3.body);
    });
});

describe("POST /api/v1/company/:company_id/users", () => {
    it("should add manager to the company ", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const emp = await createUserAndLogin();
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: emp.email,
                role: "employee"
            });
        expect(response.status).toBe(201);
        console.log(response.body);
        console.log("successfull should add emp to the company ");
    });

    it("should add emp by manager to the company ", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const manager = await createUserAndLogin();
        const emp = await createUserAndLogin();
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: manager.email,
                role: "manager"
            });
        const response2 = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", manager.cookies)
            .send({
                email: emp.email,
                role: "employee"
            });
        expect(response2.status).toBe(201);
        console.log(response.body);
        console.log(response2.body);
        console.log("successfull should add emp by manager to the company ");
    });

    it("Invalid user cannot add emps in company", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const manager = await createUserAndLogin();
        const emp = await createUserAndLogin();
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", manager.cookies)
            .send({
                email: emp.email,
                role: "employee"
            });

        expect(response.status).toBe(403);
        console.log(response.body);
        console.log(companyId);
        console.log("Successful test of invalid user to create emps");
    });

    it("manager should not add another maneger", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const manager = await createUserAndLogin();
        const manager2 = await createUserAndLogin();
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: manager.email,
                role: "manager"
            });
        const response2 = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", manager.cookies)
            .send({
                email: manager2.email,
                role: "manager"
            });
        expect(response2.status).toBe(403);
        console.log(response.body);
        console.log(response2.body);
        console.log("successfull should not add manager to manager ");
    });

    it("employee cannot add users to company", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const emp1 = await createUserAndLogin();
        const emp2 = await createUserAndLogin();
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: emp1.email,
                role: "employee"
            });
        const response2 = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", emp1.cookies)
            .send({
                email: emp2.email,
                role: "employee"
            });
        expect(response2.status).toBe(403);
        console.log(response.body);
        console.log(response2.body);
        console.log("successfull should not add any emp by emp ");
    });
});

describe("POST /api/v1/company/:company_id/updates", () => {
    it("company owner updates its own company", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const companyId = companyResponse.body.data.resp.company_id;
        const email = `vitest_${Date.now()}@example.com`;
        const response = await request(app)
            .patch(`/api/v1/company/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                company_id: companyId,
                company_name: "Updated Company",
                email,
                address: "Updated Address",
                contact_number: "9876543210",
                state: "Goa",
                gst_no: "30ABCDE1234F1Z5",
                financial_year_start: "2026-04-01",
                financial_year_end: "2027-03-31"
            });
        expect(response.status).toBe(200);
        console.log(response.body);
        expect(response.body.data.result2.company_name).toBe("Updated Company");
        expect(response.body.message).toBe("Update successful");
        console.log("successfull update company by its valid owner");
    });

    it("should reject unautheticated user", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .patch(`/api/v1/company/${companyId}`);
        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("successfully reject unautheticated user ");
    });

    it("should reject unthourized user to update company", async () => {
        const owner = await createUserAndLogin();
        const manager = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, getTestCompanyName());
        const companyId = companyResponse.body.data.resp.company_id;
        const email = `vitest_${Date.now()}@example.com`;
        const response1 = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: manager.email,
                role: "manager"
            });
        const response2 = await request(app)
            .patch(`/api/v1/company/${companyId}`)
            .set("Cookie", manager.cookies)
            .send({
                company_name: "Manager Update",
                email: "manager@example.com",
                address: "Some address",
                contact_number: "9876543210",
                state: "Goa",
                gst_no: "30ABCDE1234F1Z5",
                financial_year_start: "2026-04-01",
                financial_year_end: "2027-03-31"
            });
        expect(response2.status).toBe(403);
        console.log(response2.body);
        console.log("successfully reject unauthorized user");
    });

    it("should reject company update with same name", async () => {
        const owner = await createUserAndLogin();
        const companyNameA = getTestCompanyName("companyA");
        const companyResponse = await createCompany(owner.cookies, companyNameA);
        const companyResponse2 = await createCompany(owner.cookies, getTestCompanyName("companyB"));
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const email = `vitest_${Date.now()}@example.com`;
        const response = await request(app)
            .patch(`/api/v1/company/${companyId2}`)
            .set("Cookie", owner.cookies)
            .send({
                company_id: companyId2,
                company_name: companyNameA,
                email,
                address: "Updated Address",
                contact_number: "9876543210",
                state: "Goa",
                gst_no: "30ABCDE1234F1Z5",
                financial_year_start: "2026-04-01",
                financial_year_end: "2027-03-31"
            });
        expect(response.status).toBe(400);
        console.log(response.body);
        expect(response.body.message).toBe("You already have a company with this name");
        console.log("successfully reject company update with same name");
    });

    it("should reject update for inaccessible company", async () => {
        const owner = await createUserAndLogin();
        await createCompany(owner.cookies, getTestCompanyName());
        const response = await request(app)
            .patch(`/api/v1/company/999999`)
            .set("Cookie", owner.cookies)
            .send({
                company_name: "Inaccessible Co",
                email: "inaccessible@example.com",
                address: "123 Address",
                contact_number: "9876543210",
                state: "Goa",
                gst_no: "30ABCDE1234F1Z5",
                financial_year_start: "2026-04-01",
                financial_year_end: "2027-03-31"
            });
        expect(response.status).toBe(403);
        console.log(response.body);
        console.log("successfully tested inaccessible company");
    });

    describe("GET /api/v1/company", () => {
        it("should get all companies of logged in user", async () => {
            const owner = await createUserAndLogin();
            const companyResponse = await createCompany(owner.cookies, getTestCompanyName("co10"));
            const companyResponse2 = await createCompany(owner.cookies, getTestCompanyName("co11"));
            const companyId1 = companyResponse.body.data.resp.company_id;
            const companyId2 = companyResponse2.body.data.resp.company_id;
            const response = await request(app)
                .get("/api/v1/company")
                .set("Cookie", owner.cookies);
            expect(response.status).toBe(200);
            expect(response.body.data.result2.length).toBe(2);
            expect(response.body.data.result2.every(company => company.company_id === companyId1 || company.company_id === companyId2)).toBe(true);
            console.log(response.body);
            console.log("Successfully tested get all companies");
        });

        it("should reject user when no companies are found", async () => {
            const owner = await createUserAndLogin();
            const response = await request(app)
                .get("/api/v1/company")
                .set("Cookie", owner.cookies);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("No companies found !!");
            console.log(response.body);
            console.log("Successfully tested no companies found");
        });

        it("should only return companies belonging to logged in user", async () => {
            const owner = await createUserAndLogin();
            const owner2 = await createUserAndLogin();
            const companyResponse = await createCompany(owner.cookies, getTestCompanyName("co12"));
            await createCompany(owner2.cookies, getTestCompanyName("co13"));
            const companyId = companyResponse.body.data.resp.company_id;
            const response = await request(app)
                .get("/api/v1/company")
                .set("Cookie", owner.cookies);
            expect(response.status).toBe(200);
            expect(response.body.data.result2.every(company => company.company_id === companyId)).toBe(true);
            console.log(response.body);
            console.log("Successfully tested company isolation in get all companies");
        });

        it("should reject unauthenticated user", async () => {
            const response = await request(app)
                .get("/api/v1/company");
            expect(response.status).toBe(401);
            console.log(response.body);
            console.log("Successfully rejected unauthenticated user");
        });
    });

    describe("GET /api/v1/company/:company_id", () => {
        it("should get one company", async () => {
            const owner = await createUserAndLogin();
            const compName = getTestCompanyName("co14");
            const companyResponse = await createCompany(owner.cookies, compName);
            const companyId = companyResponse.body.data.resp.company_id;
            const response = await request(app)
                .get(`/api/v1/company/${companyId}`)
                .set("Cookie", owner.cookies);
            expect(response.status).toBe(200);
            expect(response.body.data.result2.company_id).toBe(companyId);
            expect(response.body.data.result2.company_name).toBe(compName);
            console.log(response.body);
            console.log("Successfully tested get one company");
        });

        it("should reject user from accessing another user's company", async () => {
            const owner = await createUserAndLogin();
            const owner2 = await createUserAndLogin();
            const companyResponse = await createCompany(owner.cookies, getTestCompanyName("co15"));
            const companyId = companyResponse.body.data.resp.company_id;
            const response = await request(app)
                .get(`/api/v1/company/${companyId}`)
                .set("Cookie", owner2.cookies);
            expect(response.status).toBe(403);
            console.log(response.body);
            console.log("Successfully tested inaccessible company");
        });

        it("should reject unauthenticated user", async () => {
            const owner = await createUserAndLogin();
            const companyResponse = await createCompany(owner.cookies, getTestCompanyName("co16"));
            const companyId = companyResponse.body.data.resp.company_id;
            const response = await request(app)
                .get(`/api/v1/company/${companyId}`);
            expect(response.status).toBe(401);
            console.log(response.body);
            console.log("Successfully rejected unauthenticated user");
        });
    });
});

describe("Company Endpoints - Zod Validation", () => {
    let owner;
    let companyId;

    beforeAll(async () => {
        owner = await createUserAndLogin();
        const coRes = await createCompany(owner.cookies, getTestCompanyName("ZodCo"));
        companyId = coRes.body.data.resp.company_id;
    });

    describe("POST /api/v1/company - Zod Validation", () => {
        it("should reject when company_name is missing", async () => {
            const res = await request(app)
                .post("/api/v1/company")
                .set("Cookie", owner.cookies)
                .send({
                    email: "test@example.com",
                    address: "123 Street",
                    contact_number: "9876543210",
                    state: "Goa",
                    gst_no: "30ABCDE1234F1Z5",
                    financial_year_start: "2026-04-01",
                    financial_year_end: "2027-03-31"
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject when email is invalid", async () => {
            const res = await request(app)
                .post("/api/v1/company")
                .set("Cookie", owner.cookies)
                .send({
                    company_name: "Test Co",
                    email: "not-an-email",
                    address: "123 Street",
                    contact_number: "9876543210",
                    state: "Goa",
                    gst_no: "30ABCDE1234F1Z5",
                    financial_year_start: "2026-04-01",
                    financial_year_end: "2027-03-31"
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject when contact_number is not a valid 10-digit Indian phone", async () => {
            const res = await request(app)
                .post("/api/v1/company")
                .set("Cookie", owner.cookies)
                .send({
                    company_name: "Test Co",
                    email: "test@example.com",
                    address: "123 Street",
                    contact_number: "12345",
                    state: "Goa",
                    gst_no: "30ABCDE1234F1Z5",
                    financial_year_start: "2026-04-01",
                    financial_year_end: "2027-03-31"
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject when gst_no format is invalid", async () => {
            const res = await request(app)
                .post("/api/v1/company")
                .set("Cookie", owner.cookies)
                .send({
                    company_name: "Test Co",
                    email: "test@example.com",
                    address: "123 Street",
                    contact_number: "9876543210",
                    state: "Goa",
                    gst_no: "INVALID_GST",
                    financial_year_start: "2026-04-01",
                    financial_year_end: "2027-03-31"
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject when financial year end is before financial year start", async () => {
            const res = await request(app)
                .post("/api/v1/company")
                .set("Cookie", owner.cookies)
                .send({
                    company_name: "Test Co",
                    email: "test@example.com",
                    address: "123 Street",
                    contact_number: "9876543210",
                    state: "Goa",
                    gst_no: "30ABCDE1234F1Z5",
                    financial_year_start: "2027-04-01",
                    financial_year_end: "2026-03-31"
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("GET /api/v1/company/:company_id - Zod Validation", () => {
        it("should reject when company_id is not a positive integer", async () => {
            const res = await request(app)
                .get("/api/v1/company/abc")
                .set("Cookie", owner.cookies);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject when company_id is negative or zero", async () => {
            const res = await request(app)
                .get("/api/v1/company/-5")
                .set("Cookie", owner.cookies);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("POST /api/v1/company/:company_id/users - Zod Validation", () => {
        it("should reject missing email", async () => {
            const res = await request(app)
                .post(`/api/v1/company/${companyId}/users`)
                .set("Cookie", owner.cookies)
                .send({ role: "employee" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject missing role", async () => {
            const res = await request(app)
                .post(`/api/v1/company/${companyId}/users`)
                .set("Cookie", owner.cookies)
                .send({ email: "valid@example.com" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject invalid role", async () => {
            const res = await request(app)
                .post(`/api/v1/company/${companyId}/users`)
                .set("Cookie", owner.cookies)
                .send({ email: "valid@example.com", role: "admin" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject invalid company_id param", async () => {
            const res = await request(app)
                .post(`/api/v1/company/invalid/users`)
                .set("Cookie", owner.cookies)
                .send({ email: "valid@example.com", role: "employee" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("PATCH /api/v1/company/:company_id - Zod Validation", () => {
        it("should reject when required fields are missing", async () => {
            const res = await request(app)
                .patch(`/api/v1/company/${companyId}`)
                .set("Cookie", owner.cookies)
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should reject invalid company_id in URL param", async () => {
            const res = await request(app)
                .patch("/api/v1/company/abc")
                .set("Cookie", owner.cookies)
                .send({
                    company_name: "Test Co",
                    email: "test@example.com",
                    address: "123 Street",
                    contact_number: "9876543210",
                    state: "Goa",
                    gst_no: "30ABCDE1234F1Z5",
                    financial_year_start: "2026-04-01",
                    financial_year_end: "2027-03-31"
                });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });
});
