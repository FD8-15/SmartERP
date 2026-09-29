import { createUser, loginUser, createUserAndLogin } from "./helpers/user.js";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createCompany } from "./helpers/company.js";
import { createItem } from "./helpers/item.js";
import { createSupplier } from "./helpers/supplier.js";

describe("POST /api/v1/purchase-voucher/:company_id", () => {
    it("should create purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });
        expect(response.status).toBe(201);
        console.log(response.body);
        console.log("Successfully tested create purchase voucher");
    })
    it("should Supplier not found:", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const itemResponse = await createItem(owner.cookies, companyId);
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: "99999999999",
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Supplier not found");
        console.log(response.body);
        console.log("Successfully tested supplier not found");
    })
    it("should reject item not found", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: 9999999,
                        qty: 2
                    }
                ]
            });
        expect(response.status).toBe(400);
        console.log(response.body);
        console.log("Successfully tested item not found");
    })
    it("should create purchase voucher for multiple items", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse1 = await createItem(owner.cookies, companyId);
        const itemResponse2 = await createItem(owner.cookies, companyId);
        const itemResponse3 = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;
        const itemId3 = itemResponse3.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    },
                    {
                        item_id: itemId2,
                        qty: 3
                    },
                    {
                        item_id: itemId3,
                        qty: 1
                    }
                ]
            });
        expect(response.status).toBe(201);
        console.log(response.body);
        console.log("Successfully tested cpurchase voucher for multiple items");
    })
    it("should total amount calculation", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 10, 1000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    },
                    {
                        item_id: itemId2,
                        qty: 3
                    }
                ]
            });
        expect(response.status).toBe(201);
        expect(response.body.data.voucher.total_amt).toBe("103000.00");
        console.log(response.body);
        console.log("Successfully tested total amount calculation");
    })
    it("should increase item stock after purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.current_quantity).toBe(12);
        console.log(response2.body);
        console.log("Successfully tested item stock increase after purchase voucher");
    });
    it("should reject company isolation for Supplier", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyResponse2 = await createCompany(owner2.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });
        expect(response.status).toBe(400);
        console.log(response.body);
        console.log("Successfully tested company isolation for Supplier");
    });
    it("should reject company isolation for Item", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyResponse2 = await createCompany(owner2.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const supplierResponse2 = await createSupplier(owner2.cookies, companyId2);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const supplierGst2 = supplierResponse2.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst2,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });
        expect(response.status).toBe(400);
        console.log(response.body);
        console.log("Successfully tested  reject company isolation for Item");
    });
    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/purchase-voucher/1")
        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated purchase voucher");
    });
    it("should reject invalid quantity", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company13");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: -2
                    }
                ]
            });

        expect(response.status).toBe(400);
        console.log(response.body);
        console.log("Successfully tested invalid quantity");
    });
    it("should use correct supplier", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company12");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierId = supplierResponse.body.data.supplier.supplier_id;
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(201);
        expect(response.body.data.voucher.supplier_id).toBe(supplierId);
        console.log(response.body);
        console.log("Successfully tested correct supplier in purchase voucher");
    });


    it("should calculate correct line total", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company13");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });



        expect(response.status).toBe(201);
        expect(response.body.data.items[0].total_amt).toBe("100000.00");
        console.log(response.body);
        console.log("Array of items", response.body.data.items[0]);
        console.log("Successfully tested correct line total");
    });


    it("should rollback transaction when item is invalid", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company14");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    },
                    {
                        item_id: 9999999,
                        qty: 3
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(400);
        expect(response2.status).toBe(200);
        expect(response2.body.data.AllVouchers.length).toBe(0);
        expect(response3.body.data.current_quantity).toBe(10);

        console.log(response.body);
        console.log("Successfully tested transaction rollback");
    });


    it("should reject employee from creating purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const employee = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company15");
        const companyId = companyResponse.body.data.resp.company_id;

        const addEmployee = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: employee.email,
                role: "employee"
            });

        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", employee.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        expect(addEmployee.status).toBe(201);
        expect(response.status).toBe(403);
        console.log(response.body);
        console.log("Successfully rejected employee from creating purchase voucher");
    });


    it("should reject invalid quantity", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company16");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: -2
                    }
                ]
            });

        expect(response.status).toBe(400);
        console.log(response.body);
        console.log("Successfully tested invalid quantity");
    });
})
describe("GET /api/v1/purchase-voucher/:company_id", () => {

    it("should get all purchase vouchers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company17");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.AllVouchers.length).toBe(1);
        console.log(response2.body);
        console.log("Successfully tested get all purchase vouchers");
    });


    it("should get empty purchase vouchers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company18");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.AllVouchers.length).toBe(0);
        console.log(response.body);
        console.log("Successfully tested empty purchase vouchers");
    });


    it("should reject user from accessing another company vouchers", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company19");
        const companyResponse2 = await createCompany(owner2.cookies, "company20");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner2.cookies);

        expect(companyId2).not.toBe(companyId);
        expect(response.status).toBe(403);
        console.log(response.body);
        console.log("Successfully tested voucher company isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/purchase-voucher/1");

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated user");
    });

});
describe("GET /api/v1/purchase-voucher/:company_id/:voucher_id", () => {

    it("should get one purchase voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company21");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.Voucher[0].voucher_id).toBe(voucherId);
        console.log(response2.body);
        console.log("Successfully tested get one purchase voucher");
    });


    it("should verify voucher items", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company22");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse1 = await createItem(owner.cookies, companyId);
        const itemResponse2 = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    },
                    {
                        item_id: itemId2,
                        qty: 3
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.Voucher.length).toBe(2);
        console.log(response2.body);
        console.log("Successfully tested voucher items");
    });


    it("should reject non-existent voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company23");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}/99999999`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Voucher not found");
        console.log(response.body);
        console.log("Successfully tested voucher not found");
    });


    it("should reject another company's voucher", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company24");
        const companyResponse2 = await createCompany(owner2.cookies, "company25");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId2}/${voucherId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        expect(response2.body.message).toBe("Voucher not found");
        console.log(response2.body);
        console.log("Successfully tested inaccessible voucher");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/purchase-voucher/1/1");

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated user");
    });

});
describe("PATCH /api/v1/purchase-voucher/:company_id/:voucher_id", () => {

    it("should increase purchase quantity", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company26");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;
        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId,
                        qty: 5
                    }
                ]
            });

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId}`)
            .set("Cookie", owner.cookies);


        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(15);
        console.log(response3.body);
        console.log("Successfully tested purchase quantity increase");
    });

    it("should decrease purchase quantity", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company27");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 5
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(12);
        console.log(response3.body);
        console.log("Successfully tested purchase quantity decrease");
    });


    it("should keep stock same when quantity is unchanged", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company28");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(12);
        console.log(response3.body);
        console.log("Successfully tested same purchase quantity");
    });


    it("should add new item during purchase voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company29");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 20, 1000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    },
                    {
                        item_id: itemId2,
                        qty: 3
                    }
                ]
            });

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId2}`)
            .set("Cookie", owner.cookies);

        const response4 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(23);
        expect(response4.body.data.Voucher.length).toBe(2);
        console.log(response4.body);
        console.log("Successfully tested add new item during voucher update");
    });


    it("should remove item during purchase voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company30");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 20, 1000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    },
                    {
                        item_id: itemId2,
                        qty: 3
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId1,
                        qty: 3
                    }
                ]
            });

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId2}`)
            .set("Cookie", owner.cookies);

        const response4 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies);

        console.log(response2.body);
        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(20);
        expect(response4.body.data.Voucher.length).toBe(1);
        console.log(response4.body);
        console.log("Successfully tested remove item during voucher update");
    });


    it("should recalculate total after purchase voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company31");
        const companyId = companyResponse.body.data.resp.company_id;
        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 10, 1000);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    },
                    {
                        item_id: itemId2,
                        qty: 3
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId1,
                        qty: 1
                    },
                    {
                        item_id: itemId2,
                        qty: 2
                    }
                ]
            });


        const response3 = await request(app)
            .get(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.Voucher[0].voucher_total_amt).toBe("52000.00");
        console.log(response2.body);
        console.log("Successfully tested total recalculation");
    });


    it("should reject non-existent voucher during update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company32");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/99999999`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: 1,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Voucher not found");
        console.log(response.body);
        console.log("Successfully tested non-existent voucher update");
    });


    it("should reject unauthenticated user during update", async () => {
        const response = await request(app)
            .patch("/api/v1/purchase-voucher/1/1")
            .send({
                items: [
                    {
                        item_id: 1,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(401);
        console.log(response.body);
        console.log("Successfully rejected unauthenticated purchase voucher update");
    });


    it("should reject employee from updating purchase voucher", async () => {
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

        const supplierResponse = await createSupplier(owner.cookies, companyId);
        const itemResponse = await createItem(owner.cookies, companyId);
        const supplierGst = supplierResponse.body.data.supplier.gst_no;
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/purchase-voucher/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                gst_no: supplierGst,
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        const voucherId = response.body.data.voucher.voucher_id;

        const response2 = await request(app)
            .patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`)
            .set("Cookie", employee.cookies)
            .send({
                items: [
                    {
                        item_id: itemId,
                        qty: 5
                    }
                ]
            });

        expect(addEmployee.status).toBe(201);
        expect(response.status).toBe(201);
        expect(response2.status).toBe(403);
        console.log(response2.body);
        console.log("Successfully rejected employee from updating purchase voucher");
    });
});