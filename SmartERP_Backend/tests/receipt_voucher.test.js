import { createUserAndLogin } from "./helpers/user.js";
import { createCompany } from "./helpers/company.js";
import { createSalesVoucher } from "./helpers/sale_voucher.js";
import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";


describe("POST /api/v1/receipt-voucher/:company_id/:sales_id", () => {

    it("should create receipt voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);

        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(result.response.status).toBe(201);
        expect(response.status).toBe(201);
        expect(Number(response.body.data.voucher.amount_paid)).toBe(20000);
        console.log(response.body);
        console.log("Successfully tested create receipt voucher");
    });


    it("should calculate correct remaining amount", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 30000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 90000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);

        console.log(response2.body);
        console.log("Successfully tested receipt remaining amount");
    });


    it("should reject payment greater than outstanding amount", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company12");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 120001,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("cannot pay more then remaining amount");

        console.log(response.body);
        console.log("Successfully tested receipt outstanding validation");
    });


    it("should reject payment greater than remaining amount after previous payment", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company13");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 100001,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);

        console.log(response2.body);
        console.log("Successfully tested receipt remaining validation");
    });


    it("should allow exact remaining payment", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company14");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 120000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);

        console.log(response.body);
        console.log("Successfully tested exact receipt payment");
    });


    it("should reject customer not found", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company15");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "9999999999",
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Customer not found");

        console.log(response.body);
        console.log("Successfully tested customer not found");
    });


    it("should reject non-existent sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company16");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/9999999`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "9999999999",
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Sales voucher not found");

        console.log(response.body);
        console.log("Successfully tested sales voucher not found");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/receipt-voucher/1/1")
            .send({
                connect_no: "9999999999",
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated receipt creation");
    });


    it("should reject employee from creating receipt voucher", async () => {
        const owner = await createUserAndLogin();
        const employee = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company17");
        const companyId = companyResponse.body.data.resp.company_id;

        const addEmployee = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: employee.email,
                role: "employee"
            });

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", employee.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(addEmployee.status).toBe(201);
        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully rejected employee receipt creation");
    });


    it("should reject another company access", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company18");
        const companyResponse2 = await createCompany(owner2.cookies, "company19");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId2}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully tested receipt company isolation");
    });

});
describe("GET /api/v1/receipt-voucher/:company_id/:receipt_id", () => {

    it("should get one receipt voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company20");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}/${receiptId}`)
            .set("Cookie", owner.cookies);

        expect(createResponse.status).toBe(201);
        expect(response.status).toBe(200);
        expect(response.body.data.receipt_voucher.receipt_id).toBe(receiptId);

        console.log(response.body);
        console.log("Successfully tested get one receipt voucher");
    });


    it("should reject non-existent receipt voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company21");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}/9999999`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Voucher not found");

        console.log(response.body);
        console.log("Successfully tested receipt voucher not found");
    });


    it("should reject another company receipt", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company22");
        const companyResponse2 = await createCompany(owner2.cookies, "company23");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId2}/${receiptId}`)
            .set("Cookie", owner2.cookies);

        expect(createResponse.status).toBe(201);
        expect(response.status).toBe(404);

        console.log(response.body);
        console.log("Successfully tested receipt company isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/receipt-voucher/1/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated receipt GET");
    });

});
describe("GET /api/v1/receipt-voucher/:company_id/:sales_id/:customer_id", () => {

    it("should get all receipts for sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company24");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;
        const customerId = result.customerId;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}/${salesId}/${customerId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.receipt_voucher.length).toBe(1);

        console.log(response2.body);
        console.log("Successfully tested all receipts for sales voucher");
    });

    it("should return empty receipts when sales voucher has no receipts", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company25");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}/${salesId}/${result.customerId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.receipt_voucher).toHaveLength(0);
        expect(response.body.data.pagination).toEqual({
            page: 1,
            limit: 10
        });

        console.log(response.body);
        console.log("Successfully tested empty receipts");
    });

    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/receipt-voucher/1/1/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated receipt request");
    });

});
describe("GET /api/v1/receipt-voucher/:company_id", () => {

    it("should get all receipts for company", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company26");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.receipt_voucher.length).toBe(1);

        console.log(response2.body);
        console.log("Successfully tested all company receipts");
    });


    it("should reject company with no receipts", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company27");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Vouchers not found");

        console.log(response.body);
        console.log("Successfully tested company with no receipts");
    });


    it("should reject another company receipts", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company28");
        const companyResponse2 = await createCompany(owner2.cookies, "company29");

        const companyId = companyResponse.body.data.resp.company_id;

        await createSalesVoucher(owner.cookies, companyId);

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully tested receipt company isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/receipt-voucher/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated receipt GET");
    });

});
describe("PATCH /api/v1/receipt-voucher/:company_id/:sales_id/:receipt_id", () => {

    it("should update receipt voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company30");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 30000
            });

        expect(createResponse.status).toBe(201);
        expect(response.status).toBe(200);

        console.log(response.body);
        console.log("Successfully tested receipt update");
    });


    it("should reject update above outstanding amount", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company31");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 120001
            });

        expect(createResponse.status).toBe(201);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("cannot pay more then remaining amount");

        console.log(response.body);
        console.log("Successfully tested receipt outstanding update");
    });


    it("should reject non-existent receipt update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company32");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/9999999`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 30000
            });

        expect(response.status).toBe(404);
        console.log(response.body);
        console.log("Successfully tested non-existent receipt update");
    });


    it("should reject wrong customer during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company33");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const wrongCustomer = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "Wrong Customer",
                contact_no: "9800005001"
            });

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const receiptId = createResponse.body.data.voucher.receipt_id;
        const wrongContact = wrongCustomer.body.data.Customer.contact_no;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: wrongContact,
                current_amt_paid: 30000
            });

        expect(createResponse.status).toBe(201);
        expect(response.status).toBe(404);
        console.log(response.body);
        console.log("Successfully tested wrong customer update");
    });


    it("should reject unauthenticated update", async () => {
        const response = await request(app)
            .patch("/api/v1/receipt-voucher/1/1/1")
            .send({
                connect_no: "9999999999",
                current_amt_paid: 30000
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated receipt update");
    });


    it("should reject employee from updating receipt voucher", async () => {
        const owner = await createUserAndLogin();
        const employee = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company34");
        const companyId = companyResponse.body.data.resp.company_id;

        const addEmployee = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: employee.email,
                role: "employee"
            });

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", employee.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 30000
            });

        expect(addEmployee.status).toBe(201);
        expect(createResponse.status).toBe(201);
        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully rejected employee receipt update");
    });

});



describe("Receipt Voucher - Zod Validation", () => {

    // ── POST body validation ──────────────────────────────────────────────────

    it("should reject missing connect_no", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z1");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: missing connect_no →", response.body.message);
    });

    it("should reject invalid connect_no format", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z2");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "12345",
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: invalid connect_no format →", response.body.message);
    });

    it("should reject missing current_amt_paid", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z3");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: missing current_amt_paid →", response.body.message);
    });

    it("should reject negative current_amt_paid", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z4");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: -500,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: negative current_amt_paid →", response.body.message);
    });

    it("should reject zero current_amt_paid", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z5");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 0,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: zero current_amt_paid →", response.body.message);
    });

    it("should reject missing date", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z6");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: missing date →", response.body.message);
    });

    it("should reject invalid date format", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z7");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "28-09-2026",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: invalid date format →", response.body.message);
    });

    it("should reject missing mode", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z8");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: missing mode →", response.body.message);
    });

    it("should reject empty mode string", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z9");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: ""
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: empty mode →", response.body.message);
    });

    // ── POST param validation ─────────────────────────────────────────────────

    it("should reject non-integer company_id param on POST", async () => {
        const owner = await createUserAndLogin();

        const response = await request(app)
            .post("/api/v1/receipt-voucher/xyz/1")
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "9876543210",
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: non-integer company_id →", response.body.message);
    });

    it("should reject negative sales_id param on POST", async () => {
        const owner = await createUserAndLogin();

        const response = await request(app)
            .post("/api/v1/receipt-voucher/1/-5")
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "9876543210",
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: negative sales_id →", response.body.message);
    });

    // ── PATCH body validation ─────────────────────────────────────────────────

    it("should reject missing connect_no on PATCH", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z10");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });
        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                current_amt_paid: 30000
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: missing connect_no on PATCH →", response.body.message);
    });

    it("should reject invalid connect_no on PATCH", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z11");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });
        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "12345",
                current_amt_paid: 30000
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: invalid connect_no on PATCH →", response.body.message);
    });

    it("should reject missing current_amt_paid on PATCH", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z12");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });
        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: missing current_amt_paid on PATCH →", response.body.message);
    });

    it("should reject negative current_amt_paid on PATCH", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z13");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const createResponse = await request(app)
            .post(`/api/v1/receipt-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: 20000,
                date: "2026-09-28",
                mode: "cash"
            });
        const receiptId = createResponse.body.data.voucher.receipt_id;

        const response = await request(app)
            .patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`)
            .set("Cookie", owner.cookies)
            .send({
                connect_no: result.contactNo,
                current_amt_paid: -100
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: negative current_amt_paid on PATCH →", response.body.message);
    });

    it("should reject invalid receipt_id param on PATCH", async () => {
        const owner = await createUserAndLogin();

        const response = await request(app)
            .patch("/api/v1/receipt-voucher/1/1/abc")
            .set("Cookie", owner.cookies)
            .send({
                connect_no: "9876543210",
                current_amt_paid: 30000
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: invalid receipt_id param on PATCH →", response.body.message);
    });

    // ── GET query validation ──────────────────────────────────────────────────

    it("should reject invalid page query param on GET receipts by sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z14");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}/${salesId}/${result.customerId}?page=abc`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: invalid page query →", response.body.message);
    });

    it("should reject limit exceeding 100 on GET receipts by sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company_rv_z15");
        const companyId = companyResponse.body.data.resp.company_id;
        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .get(`/api/v1/receipt-voucher/${companyId}/${salesId}/${result.customerId}?limit=200`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
        console.log("Zod: limit > 100 →", response.body.message);
    });
});
