import { createUserAndLogin } from "./helpers/user.js";
import { createCompany } from "./helpers/company.js";
import { createPurchaseVoucher } from "./helpers/purchase_voucher.js";
import { createSupplier } from "./helpers/supplier.js";
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";


describe("POST /api/v1/payment-voucher/:company_id/:voucher_id/:supplier_id", () => {

    it("should create payment voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.Voucher.amount_paid).toBe("20000.00");
        console.log(response.body);
        console.log("Successfully tested create payment voucher");
    });


    it("should calculate correct remaining amount", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 30000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);

        const response2 = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 70000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response2.status).toBe(201);
        console.log(response2.body);
        console.log("Successfully tested remaining amount calculation");
    });


    it("should reject payment greater than outstanding amount", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company12");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 100001,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Cannot pay more than outstanding amount");
        console.log(response.body);
        console.log("Successfully tested payment greater than outstanding amount");
    });


    it("should reject payment greater than remaining amount after previous payment", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company13");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 80001,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body);
        console.log("Successfully tested payment against remaining amount");
    });


    it("should allow exact remaining payment", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company14");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 80000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        console.log(response2.body);
        console.log("Successfully tested exact remaining payment");
    });


    it("should reject non-existent purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company15");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/9999999/1`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("No voucher found");
        console.log(response.body);
        console.log("Successfully tested non-existent purchase voucher");
    });


    it("should reject wrong supplier for purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company16");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const wrongSupplierId = supplierResponse.body.data.supplier.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${wrongSupplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("No voucher found");
        console.log(response.body);
        console.log("Successfully tested wrong supplier");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/payment-voucher/1/1/1")
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated payment");
    });


    it("should reject employee from creating payment voucher", async () => {
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

        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", employee.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(addEmployee.status).toBe(201);
        expect(response.status).toBe(403);
        console.log(response.body);
        console.log("Successfully rejected employee payment creation");
    });


    it("should reject another company's payment creation", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company18");
        const companyResponse2 = await createCompany(owner2.cookies, "company19");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId2}/${voucherId}/${supplierId}`)
            .set("Cookie", owner2.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        expect(response.status).toBe(400);
        console.log(response.body);
        console.log("Successfully tested payment company isolation");
    });

});


describe("GET /api/v1/payment-voucher/:company_id/:voucher_id/:supplier_id/:payment_id", () => {

    it("should get one payment voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company20");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const paymentId = response.body.data.Voucher.payment_id;

        const response2 = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/${paymentId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.voucher.payment_id).toBe(paymentId);
        console.log(response2.body);
        console.log("Successfully tested get one payment voucher");
    });


    it("should reject non-existent payment voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company21");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/9999999`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Voucher not found");
        console.log(response.body);
        console.log("Successfully tested payment not found");
    });


    it("should reject wrong supplier", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company22");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const wrongSupplierId = supplierResponse.body.data.supplier.supplier_id;
        const paymentResponse = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${purchaseResponse.body.data.voucher.supplier_id}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const paymentId = paymentResponse.body.data.Voucher.payment_id;

        const response = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${wrongSupplierId}/${paymentId}`)
            .set("Cookie", owner.cookies);

        expect(paymentResponse.status).toBe(201);
        expect(response.status).toBe(404);
        console.log(response.body);
        console.log("Successfully tested payment supplier isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/payment-voucher/1/1/1/1");

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated get one payment");
    });

});


describe("GET /api/v1/payment-voucher/:company_id/:voucher_id/:supplier_id", () => {

    it("should get all payments for purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company23");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 30000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response3 = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(200);
        expect(response3.body.data.voucher.length).toBe(2);
        console.log(response3.body);
        console.log("Successfully tested all payments for purchase voucher");
    });


    it("should reject when purchase voucher has no payments", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company24");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Vouchers not found");
        console.log(response.body);
        console.log("Successfully tested no payments for purchase voucher");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/payment-voucher/1/1/1");

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated payments");
    });

});


describe("GET /api/v1/payment-voucher/:company_id", () => {

    it("should get all payments for company", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company25");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.voucher.length).toBe(1);
        console.log(response2.body);
        console.log("Successfully tested all company payments");
    });


    it("should reject company with no payments", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company26");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/payment-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Vouchers not found");
        console.log(response.body);
        console.log("Successfully tested company with no payments");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/payment-voucher/1");

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated company payment request");
    });


    it("should reject another company's payments", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company27");
        const companyResponse2 = await createCompany(owner2.cookies, "company28");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .get(`/api/v1/payment-voucher/${companyId2}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(404);
        expect(response2.body.message).toBe("Vouchers not found");
        console.log(response2.body);
        console.log("Successfully tested company payment isolation");
    });

});


describe("PATCH /api/v1/payment-voucher/:company_id/:voucher_id/:supplier_id/:payment_id", () => {

    it("should update payment voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company29");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const paymentId = response.body.data.Voucher.payment_id;

        const response2 = await request(app)
            .patch(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/${paymentId}`)
            .set("Cookie", owner.cookies)
            .send({
                amtNew: 30000
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.voucher.amount_paid).toBe("30000.00");
        console.log(response2.body);
        console.log("Successfully tested payment voucher update");
    });


    it("should reject update when new amount exceeds outstanding amount", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company30");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const response2 = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 30000,
                date: "2026-09-28",
                mode: "cash"
            });

        const paymentId = response2.body.data.Voucher.payment_id;

        const response3 = await request(app)
            .patch(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/${paymentId}`)
            .set("Cookie", owner.cookies)
            .send({
                amtNew: 90000
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(400);
        expect(response3.body.message).toBe("Cannot pay more than outstanding amount");
        console.log(response3.body);
        console.log("Successfully tested payment update outstanding validation");
    });


    it("should reject non-existent payment update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company31");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .patch(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/99999999`)
            .set("Cookie", owner.cookies)
            .send({
                amtNew: 30000
            });

        expect(response.status).toBe(404);
        console.log(response.body);
        console.log("Successfully tested non-existent payment update");
    });


    it("should reject wrong supplier during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company32");
        const companyId = companyResponse.body.data.resp.company_id;
        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;
        const wrongSupplierId = supplierResponse.body.data.supplier.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const paymentId = response.body.data.Voucher.payment_id;

        const response2 = await request(app)
            .patch(`/api/v1/payment-voucher/${companyId}/${voucherId}/${wrongSupplierId}/${paymentId}`)
            .set("Cookie", owner.cookies)
            .send({
                amtNew: 30000
            });

        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body);
        console.log("Successfully tested payment supplier isolation during update");
    });


    it("should reject unauthenticated user during update", async () => {
        const response = await request(app)
            .patch("/api/v1/payment-voucher/1/1/1/1")
            .send({
                amtNew: 30000
            });

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated payment update");
    });


    it("should reject employee from updating payment voucher", async () => {
        const owner = await createUserAndLogin();
        const employee = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company33");
        const companyId = companyResponse.body.data.resp.company_id;

        const addEmployee = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: employee.email,
                role: "employee"
            });

        const purchaseResponse = await createPurchaseVoucher(owner.cookies, companyId);
        const voucherId = purchaseResponse.body.data.voucher.voucher_id;
        const supplierId = purchaseResponse.body.data.voucher.supplier_id;

        const response = await request(app)
            .post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`)
            .set("Cookie", owner.cookies)
            .send({
                paid_amt: 20000,
                date: "2026-09-28",
                mode: "cash"
            });

        const paymentId = response.body.data.Voucher.payment_id;

        const response2 = await request(app)
            .patch(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/${paymentId}`)
            .set("Cookie", employee.cookies)
            .send({
                amtNew: 30000
            });

        expect(addEmployee.status).toBe(201);
        expect(response.status).toBe(201);
        expect(response2.status).toBe(403);
        console.log(response2.body);
        console.log("Successfully rejected employee payment update");
    });

});