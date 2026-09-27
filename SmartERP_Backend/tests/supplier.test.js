import { createUser, loginUser, createUserAndLogin } from "./helpers/user.js";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createCompany } from "./helpers/company.js";
import { createUnit } from "./helpers/unit.js";
import { createCategory } from "./helpers/category.js";

describe("POST /api/v1/supplier/:company_id", () => {
    it("should create a supplier", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            })
            expect(response.status).toBe(201)
            console.log(response.body)
            console.log("Successfully tested create supplier")
    })
})

describe("POST /api/v1/supplier/:company_id", () => {

    it("should reject duplicate GST in same company", async () => {
        const gst = `30ABCDE${Date.now()}`;

        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier1_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: gst
            });

        const response2 = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "XYZ Traders",
                contact_no: "9876543211",
                email: `supplier2_${Date.now()}@example.com`,
                address: "456 Test Street",
                gst_no: gst
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(409);
        expect(response2.body.message).toBe("Supplier already exists");

        console.log(response2.body);
        console.log("Successfully tested duplicate GST");
    });


    it("should allow same GST in different company", async () => {
        const gst = `30ABCDE${Date.now()}`;

        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company12");
        const companyResponse2 = await createCompany(owner2.cookies, "company13");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier1_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: gst
            });

        const response2 = await request(app)
            .post(`/api/v1/supplier/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543211",
                email: `supplier2_${Date.now()}@example.com`,
                address: "456 Test Street",
                gst_no: gst
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);

        console.log(response2.body);
        console.log("Successfully tested same GST in different company");
    });


    it("should reject empty required field", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company14");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("All fields are required");

        console.log(response.body);
        console.log("Successfully tested empty supplier field");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/supplier/1")
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated supplier create");
    });

});


describe("GET /api/v1/supplier/:company_id", () => {

    it("should get all suppliers of company", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company15");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            });

        const response2 = await request(app)
            .get(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.suppliers.length).toBe(1);

        expect(
            response2.body.data.suppliers.every(
                supplier => supplier.company_id === companyId
            )
        ).toBe(true);

        console.log(response2.body);
        console.log("Successfully tested get all suppliers");
    });


    it("should get empty suppliers when company has no suppliers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company16");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.suppliers.length).toBe(0);

        console.log(response.body);
        console.log("Successfully tested no suppliers in company");
    });


    it("should reject user from accessing another company suppliers", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company17");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully tested supplier company isolation");
    });


    it("should reject unauthenticated user", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company18");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/supplier/${companyId}`);

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated user");
    });

});


describe("GET /api/v1/supplier/:company_id/:supplier_id", () => {

    it("should get one supplier", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company19");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            });

        const supplierId = response.body.data.supplier.supplier_id;

        const response2 = await request(app)
            .get(`/api/v1/supplier/${companyId}/${supplierId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.supplier.supplier_id).toBe(supplierId);
        expect(response2.body.data.supplier.company_id).toBe(companyId);

        console.log(response2.body);
        console.log("Successfully tested get one supplier");
    });


    it("should reject non-existent supplier", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company20");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/supplier/${companyId}/99999999`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Supplier does not exists now!!");

        console.log(response.body);
        console.log("Successfully tested supplier not found");
    });


    it("should reject another company's supplier", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company21");
        const companyResponse2 = await createCompany(owner2.cookies, "company22");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            });

        const supplierId = response.body.data.supplier.supplier_id;

        const response2 = await request(app)
            .get(`/api/v1/supplier/${companyId2}/${supplierId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(404);
        expect(response2.body.message).toBe("Supplier does not exists now!!");

        console.log(response2.body);
        console.log("Successfully tested inaccessible supplier");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/supplier/1/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated user");
    });

});


describe("PATCH /api/v1/supplier/:company_id/:supplier_id", () => {

    it("should update the supplier", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company23");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `30ABCDE${Date.now()}`
            });

        const supplierId = response.body.data.supplier.supplier_id;

        const response2 = await request(app)
            .patch(`/api/v1/supplier/${companyId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Traders",
                contact_no: "9999999999",
                email: `updated_${Date.now()}@example.com`,
                address: "Updated Address",
                gst_no: `40ABCDE${Date.now()}`
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.supplierUpdated.name).toBe("Updated Traders");
        expect(response2.body.data.supplierUpdated.contact_no).toBe("9999999999");

        console.log(response2.body);
        console.log("Successfully tested update supplier");
    });


    it("should reject duplicate GST during update", async () => {
        const gst = `30ABCDE${Date.now()}`;

        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company24");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier1_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: `40ABCDE${Date.now()}`
            });

        const response2 = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "XYZ Traders",
                contact_no: "9876543211",
                email: `supplier2_${Date.now()}@example.com`,
                address: "456 Test Street",
                gst_no: gst
            });

        const supplierId = response.body.data.supplier.supplier_id;

        const response3 = await request(app)
            .patch(`/api/v1/supplier/${companyId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Traders",
                contact_no: "9999999999",
                email: `updated_${Date.now()}@example.com`,
                address: "Updated Address",
                gst_no: gst
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(409);
        expect(response3.body.message).toBe("Already exists");

        console.log(response3.body);
        console.log("Successfully tested duplicate GST during supplier update");
    });


    it("should update supplier with same GST", async () => {
        const gst = `30ABCDE${Date.now()}`;

        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company25");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/supplier/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Traders",
                contact_no: "9876543210",
                email: `supplier_${Date.now()}@example.com`,
                address: "123 Test Street",
                gst_no: gst
            });

        const supplierId = response.body.data.supplier.supplier_id;

        const response2 = await request(app)
            .patch(`/api/v1/supplier/${companyId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Traders",
                contact_no: "9999999999",
                email: `updated_${Date.now()}@example.com`,
                address: "Updated Address",
                gst_no: gst
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);

        console.log(response2.body);
        console.log("Successfully tested same GST during supplier update");
    });


    it("should reject non-existent supplier during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company26");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .patch(`/api/v1/supplier/${companyId}/99999999`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Updated Traders",
                contact_no: "9999999999",
                email: `updated_${Date.now()}@example.com`,
                address: "Updated Address",
                gst_no: `50ABCDE${Date.now()}`
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Customer not found");

        console.log(response.body);
        console.log("Successfully tested non-existent supplier update");
    });


    it("should reject empty field during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company27");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .patch(`/api/v1/supplier/${companyId}/99999999`)
            .set("Cookie", owner.cookies)
            .send({
                name: "",
                contact_no: "9999999999",
                email: `updated_${Date.now()}@example.com`,
                address: "Updated Address",
                gst_no: `50ABCDE${Date.now()}`
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("All fields are required");

        console.log(response.body);
        console.log("Successfully tested empty field during supplier update");
    });


    it("should reject unauthenticated user during update", async () => {
        const response = await request(app)
            .patch("/api/v1/supplier/1/1")
            .send({
                name: "Updated Traders",
                contact_no: "9999999999",
                email: `updated_${Date.now()}@example.com`,
                address: "Updated Address",
                gst_no: `50ABCDE${Date.now()}`
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated supplier update");
    });

});

