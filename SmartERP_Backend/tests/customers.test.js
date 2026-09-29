import { createUserAndLogin } from "./helpers/user.js";
import { createCompany } from "./helpers/company.js";
import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";


describe("POST /api/v1/customer/:company_id", () => {

    it("should create customer", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.Customer.name).toBe("ABC Customer");
        expect(response.body.data.Customer.contact_no).toBe("9876543210");

        console.log(response.body);
        console.log("Successfully tested create customer");
    });


    it("should reject duplicate customer contact", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;

        await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const response = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "XYZ Customer",
                contact_no: "9876543210"
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("Customer already exists");

        console.log(response.body);
        console.log("Successfully tested duplicate customer");
    });


    it("should reject missing fields", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company12");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "",
                contact_no: "9876543210"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("All fields are required");

        console.log(response.body);
        console.log("Successfully tested missing customer fields");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/customer/1")
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated customer creation");
    });


    it("should reject another company access", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company13");
        const companyResponse2 = await createCompany(owner2.cookies, "company14");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner2.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        expect(companyId).not.toBe(companyId2);
        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully tested customer company isolation");
    });

});


describe("GET /api/v1/customer/:company_id", () => {

    it("should get all customers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company15");
        const companyId = companyResponse.body.data.resp.company_id;

        await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const response = await request(app)
            .get(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.customers.length).toBe(1);

        console.log(response.body);
        console.log("Successfully tested get all customers");
    });


    it("should get empty customers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company16");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.customers.length).toBe(0);

        console.log(response.body);
        console.log("Successfully tested empty customers");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/customer/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated customer request");
    });

});


describe("GET /api/v1/customer/:company_id/:customer_id", () => {

    it("should get one customer", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company17");
        const companyId = companyResponse.body.data.resp.company_id;

        const createResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const customerId = createResponse.body.data.Customer.customer_id;

        const response = await request(app)
            .get(`/api/v1/customer/${companyId}/${customerId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.customer.customer_id).toBe(customerId);

        console.log(response.body);
        console.log("Successfully tested get one customer");
    });


    it("should reject non-existent customer", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company18");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/customer/${companyId}/9999999`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("customer does not exists now!!");

        console.log(response.body);
        console.log("Successfully tested customer not found");
    });


    it("should reject another company's customer", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company19");
        const companyResponse2 = await createCompany(owner2.cookies, "company20");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const createResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const customerId = createResponse.body.data.Customer.customer_id;

        const response = await request(app)
            .get(`/api/v1/customer/${companyId2}/${customerId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(404);

        console.log(response.body);
        console.log("Successfully tested customer company isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/customer/1/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated customer request");
    });

});


describe("PATCH /api/v1/customer/:company_id/:customer_id", () => {

    it("should update customer", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company21");
        const companyId = companyResponse.body.data.resp.company_id;

        const createResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const customerId = createResponse.body.data.Customer.customer_id;

        const response = await request(app)
            .patch(`/api/v1/customer/${companyId}/${customerId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Customer",
                contact_no: "9999999999"
            });

        expect(response.status).toBe(200);
        expect(response.body.data.customerUpdated.name).toBe("Updated Customer");
        expect(response.body.data.customerUpdated.contact_no).toBe("9999999999");

        console.log(response.body);
        console.log("Successfully tested customer update");
    });


    it("should reject duplicate contact during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company22");
        const companyId = companyResponse.body.data.resp.company_id;

        await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Customer One",
                contact_no: "9876543210"
            });

        const createResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Customer Two",
                contact_no: "9999999999"
            });

        const customerId = createResponse.body.data.Customer.customer_id;

        const response = await request(app)
            .patch(`/api/v1/customer/${companyId}/${customerId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Customer",
                contact_no: "9876543210"
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("contanct no. already exists");

        console.log(response.body);
        console.log("Successfully tested duplicate contact during update");
    });


    it("should reject missing fields during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company23");
        const companyId = companyResponse.body.data.resp.company_id;

        const createResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const customerId = createResponse.body.data.Customer.customer_id;

        const response = await request(app)
            .patch(`/api/v1/customer/${companyId}/${customerId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "",
                contact_no: "9999999999"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("All fields are required");

        console.log(response.body);
        console.log("Successfully tested missing fields during customer update");
    });


    it("should reject non-existent customer update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company24");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .patch(`/api/v1/customer/${companyId}/9999999`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Customer",
                contact_no: "9999999999"
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Customer not found");

        console.log(response.body);
        console.log("Successfully tested non-existent customer update");
    });


    it("should reject unauthenticated user during update", async () => {
        const response = await request(app)
            .patch("/api/v1/customer/1/1")
            .send({
                name: "Updated Customer",
                contact_no: "9999999999"
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated customer update");
    });


    it("should reject another company's customer update", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company25");
        const companyResponse2 = await createCompany(owner2.cookies, "company26");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const createResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: "9876543210"
            });

        const customerId = createResponse.body.data.Customer.customer_id;

        const response = await request(app)
            .patch(`/api/v1/customer/${companyId2}/${customerId}`)
            .set("Cookie", owner2.cookies)
            .send({
                name: "Updated Customer",
                contact_no: "9999999999"
            });

        expect(response.status).toBe(404);

        console.log(response.body);
        console.log("Successfully tested customer update isolation");
    });

});