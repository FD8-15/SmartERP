import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request, { cookies } from "supertest";
import app from "../src/app.js";
import { response } from "express";

describe("POST /api/v1/company", () => {

    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/company")
        expect(response.status).toBe(401);
        console.log("Cannot create without login")
    });

});
async function createCompany(cookies, companyName) {

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

    return response;
}

async function createUserAndLogin() {
    let cookies;
    const email = `vitest_${Date.now()}@example.com`;
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
        const email = `vitest_${Date.now()}@example.com`;

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

    it("should create a company", async () => {

        const companyName = `Test Company ${Date.now()}`;
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
        console.log("company created")
        console.log(response.body)
    });

    it("should reject create company more then 5 times with same user", async (req, res) => {
        await createCompany(cookies, "companyName1");
        await createCompany(cookies, "companyName2");
        await createCompany(cookies, "companyName3");
        await createCompany(cookies, "companyName4");
        await createCompany(cookies, "companyName5");
        const response3 = await createCompany(cookies, "companyName6");

        expect(response3.status).toBe(400)
        console.log(response3.body)
    })

});

describe("POST /api/v1/company/:company_id/users", () => {

    it("should add manager to the company ", async (req, res) => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const emp = await createUserAndLogin()
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: emp.email,
                role: "employee"
            });
        expect(response.status).toBe(201);
        console.log(response.body)
        console.log("successfull should add emp to the company ")
    })

    it("should add emp by manager to the company ", async (req, res) => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const manager = await createUserAndLogin()
        const emp = await createUserAndLogin()
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
        console.log(response.body)
        console.log(response2.body)
        console.log("successfull should add emp by manager to the company ")
    })
    it("Invalid user cannot add emps in company", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const manager = await createUserAndLogin()
        const emp = await createUserAndLogin()
        const companyId = companyResponse.body.data.resp.company_id
        const response = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", manager.cookies)
            .send({
                email: emp.email,
                role: "employee"
            });

        expect(response.status).toBe(403);
        console.log(response.body)
        console.log(companyId)
        console.log("Successful test of invalid user to create emps")
    })

    it("manager should not add another maneger", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const manager = await createUserAndLogin()
        const manager2 = await createUserAndLogin()
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
        console.log(response.body)
        console.log(response2.body)
        console.log("successfull should not add manager to manager ")
    })

    it("employee cannot add users to company", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const emp1 = await createUserAndLogin()
        const emp2 = await createUserAndLogin()
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
        console.log(response.body)
        console.log(response2.body)
        console.log("successfull should not add any emp by emp ")
    })
})
describe("POST /api/v1/company/:company_id/updates", () => {

    it("company owner updates its own company", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
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
        console.log(response.body)
        expect(response.body.data.result2.company_name).toBe("Updated Company");
        expect(response.body.message).toBe("Update successful");
        console.log("successfull update company by its valid owner")
    })
    it("should reject unautheticated user", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const companyId = companyResponse.body.data.resp.company_id;
        const email = `vitest_${Date.now()}@example.com`;
        const response = await request(app)
            .patch(`/api/v1/company/${companyId}`)
        expect(response.status).toBe(401);
        console.log(response.body)
        console.log("successfully reject unautheticated user ")
    })
    it("should reject unthourized user to update company", async () => {
        const owner = await createUserAndLogin()
        const manager = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
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
        expect(response2.status).toBe(403);
        console.log(response2.body)
        console.log("successfully reject unauthorized user")
    })

    it("should reject company update with same name", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const companyResponse2 = await createCompany(owner.cookies, "companyName9")
        const companyId1 = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const email = `vitest_${Date.now()}@example.com`;
        const response = await request(app)
            .patch(`/api/v1/company/${companyId2}`)
            .set("Cookie", owner.cookies)
            .send({
                company_id: companyId2,
                company_name: "companyName8",
                email,
                address: "Updated Address",
                contact_number: "9876543210",
                state: "Goa",
                gst_no: "30ABCDE1234F1Z5",
                financial_year_start: "2026-04-01",
                financial_year_end: "2027-03-31"
            });
        expect(response.status).toBe(400);
        console.log(response.body)
        expect(response.body.message).toBe("You already have a company with this name");
        console.log("successfully reject company update with same name")
    })

    it("should reject update for inaccessible company", async () => {
        const owner = await createUserAndLogin()
        const companyResponse = await createCompany(owner.cookies, "companyName8")
        const companyId = companyResponse.body.data.resp.company_id;
        const email = `vitest_${Date.now()}@example.com`;
        const response = await request(app)
            .patch(`/api/v1/company/000`)
            .set("Cookie", owner.cookies)
        expect(response.status).toBe(403);
        console.log(response.body)
        console.log("successfully tested inaccessible company")
    })


})
