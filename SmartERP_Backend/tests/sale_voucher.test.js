import { createUserAndLogin } from "./helpers/user.js";
import { createCompany } from "./helpers/company.js";
import { createItem } from "./helpers/item.js";
import { createSalesVoucher } from "./helpers/sale_voucher.js";
import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";


describe("POST /api/v1/sales-voucher/:company_id/:customer_id/:contact_no", () => {

    it("should create sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);


        expect(result.response.status).toBe(201);
        expect(result.response.body.data.Voucher.customer_id).toBe(result.customerId);
        expect(result.response.body.data.Voucher.sales_id).toBeDefined();

        console.log(result.response.body);
        console.log("Successfully tested create sales voucher");
    });


    it("should calculate correct line total", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse = await createItem(owner.cookies, companyId, 10, 50000);
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(201);
        expect(response.body.data.Voucher.total_amt).toBe("120000");

        console.log(response.body);
        console.log("Successfully tested sales voucher total calculation");
    });


    it("should reject customer not found", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company12");
        const companyId = companyResponse.body.data.resp.company_id;

        const itemResponse = await createItem(owner.cookies, companyId);
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/9999999/9999999999`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("No customer found");

        console.log(response.body);
        console.log("Successfully tested customer not found");
    });


    it("should reject item not found", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company13");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: 9999999,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("No item found");

        console.log(response.body);
        console.log("Successfully tested item not found");
    });


    it("should reject insufficient stock", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company14");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse = await createItem(owner.cookies, companyId, 10);
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: itemId,
                        qty: 11
                    }
                ]
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("cannot sell more then current quantity");

        console.log(response.body);
        console.log("Successfully tested insufficient stock");
    });


    it("should decrease item stock after sale", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company15");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId, 2);

        const response2 = await request(app)
            .get(`/api/v1/item/${companyId}/${result.itemId}`)
            .set("Cookie", owner.cookies);

        expect(result.response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.current_quantity).toBe(8);

        console.log(response2.body);
        console.log("Successfully tested sales stock decrease");
    });


    it("should create sales voucher for multiple items", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company16");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse1 = await createItem(owner.cookies, companyId);
        const itemResponse2 = await createItem(owner.cookies, companyId);
        const itemResponse3 = await createItem(owner.cookies, companyId);

        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;
        const itemId3 = itemResponse3.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
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
        console.log("Successfully tested multiple sales items");
    });


    it("should rollback transaction when item is invalid", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company17");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse = await createItem(owner.cookies, companyId, 10);
        const itemId = itemResponse.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: itemId,
                        qty: 2
                    },
                    {
                        item_id: 9999999,
                        qty: 2
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId}`)
            .set("Cookie", owner.cookies);

        const response3 = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(400);
        expect(response2.body.data.current_quantity).toBe(10);
        expect(response3.body.data.Vouchers.length).toBe(0);

        console.log(response.body);
        console.log("Successfully tested sales transaction rollback");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .post("/api/v1/sales-voucher/1/1/9999999999")
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: 1,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated sales voucher");
    });


    it("should reject employee from creating sales voucher", async () => {
        const owner = await createUserAndLogin();
        const employee = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company18");
        const companyId = companyResponse.body.data.resp.company_id;

        const addEmployee = await request(app)
            .post(`/api/v1/company/${companyId}/users`)
            .set("Cookie", owner.cookies)
            .send({
                email: employee.email,
                role: "employee"
            });

        const result = await createSalesVoucher(owner.cookies, companyId);

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${result.customerId}/${result.contactNo}`)
            .set("Cookie", employee.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: result.itemId,
                        qty: 2
                    }
                ]
            });

        expect(addEmployee.status).toBe(201);
        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully rejected employee sales creation");
    });


    it("should reject another company access", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company19");
        const companyResponse2 = await createCompany(owner2.cookies, "company20");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId2}/${result.customerId}/${result.contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: result.itemId,
                        qty: 2
                    }
                ]
            });

        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully tested sales company isolation");
    });

});
describe("GET /api/v1/sales-voucher/:company_id", () => {

    it("should get all sales vouchers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company37");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);

        const response = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(result.response.status).toBe(201);
        expect(response.status).toBe(200);
        expect(response.body.data.Vouchers.length).toBe(1);

        console.log(response.body);
        console.log("Successfully tested get all sales vouchers");
    });


    it("should get empty sales vouchers", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company38");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(200);
        expect(response.body.data.Vouchers.length).toBe(0);

        console.log(response.body);
        console.log("Successfully tested empty sales vouchers");
    });


    it("should reject another company access", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company39");
        const companyResponse2 = await createCompany(owner2.cookies, "company40");

        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully tested sales voucher company isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/sales-voucher/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated sales voucher request");
    });
});

describe("GET /api/v1/sales-voucher/:company_id/:sales_id", () => {

    it("should get one sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company41");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies);

        expect(result.response.status).toBe(201);
        expect(response.status).toBe(200);
        expect(response.body.data.Vouchers.sales_id).toBe(salesId);

        console.log(response.body);
        console.log("Successfully tested get one sales voucher");
    });


    it("should reject non-existent sales voucher", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company42");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}/9999999`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Voucher not found");

        console.log(response.body);
        console.log("Successfully tested sales voucher not found");
    });


    it("should reject another company's voucher", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company43");
        const companyResponse2 = await createCompany(owner2.cookies, "company44");

        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .get(`/api/v1/sales-voucher/${companyId2}/${salesId}`)
            .set("Cookie", owner2.cookies);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Voucher not found");

        console.log(response.body);
        console.log("Successfully tested sales voucher isolation");
    });


    it("should reject unauthenticated user", async () => {
        const response = await request(app)
            .get("/api/v1/sales-voucher/1/1");

        expect(response.status).toBe(401);

        console.log(response.body);
        console.log("Successfully rejected unauthenticated sales voucher request");
    });

});
describe("PATCH /api/v1/sales-voucher/:company_id/:sales_id", () => {

    it("should increase sold quantity", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company45");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId, 2);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: result.itemId,
                        qty: 5
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/item/${companyId}/${result.itemId}`)
            .set("Cookie", owner.cookies);
        console.log(response2.body);
        expect(result.response.status).toBe(201);
        expect(response.status).toBe(200);
        expect(response2.body.data.current_quantity).toBe(5);

        console.log(response2.body);
        console.log("Successfully tested increase sold quantity");
    });


    it("should decrease sold quantity", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company46");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId, 5);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: result.itemId,
                        qty: 2
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/item/${companyId}/${result.itemId}`)
            .set("Cookie", owner.cookies);

        expect(result.response.status).toBe(201);
        expect(response.status).toBe(200);
        expect(response2.body.data.current_quantity).toBe(8);

        console.log(response2.body);
        console.log("Successfully tested decrease sold quantity");
    });


    it("should keep stock same when quantity is unchanged", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company47");
        const companyId = companyResponse.body.data.resp.company_id;

        const result = await createSalesVoucher(owner.cookies, companyId, 2);
        const salesId = result.response.body.data.Voucher.sales_id;

        const response = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: result.itemId,
                        qty: 2
                    }
                ]
            });

        const response2 = await request(app)
            .get(`/api/v1/item/${companyId}/${result.itemId}`)
            .set("Cookie", owner.cookies);

        expect(result.response.status).toBe(201);
        expect(response.status).toBe(200);
        expect(response2.body.data.current_quantity).toBe(8);

        console.log(response2.body);
        console.log("Successfully tested unchanged sold quantity");
    });


    it("should add new item during sales voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company48");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 20, 1000);

        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    }
                ]
            });

        const salesId = response.body.data.Voucher.sales_id;

        const response2 = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
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
            .get(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(17);
        expect(response4.body.data.Vouchers).toBeDefined();

        console.log(response4.body);
        console.log("Successfully tested add new sales item");
    });


    it("should remove item during sales voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company49");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 20, 1000);

        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
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

        const salesId = response.body.data.Voucher.sales_id;

        const response2 = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies)
            .send({
                items: [
                    {
                        item_id: itemId1,
                        qty: 2
                    }
                ]
            });

        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${itemId2}`)
            .set("Cookie", owner.cookies);

        const response4 = await request(app)
            .get(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.current_quantity).toBe(20);
        expect(response4.body.data.Vouchers).toBeDefined();

        console.log(response4.body);
        console.log("Successfully tested remove sales item");
    });


    it("should recalculate total after sales voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company50");
        const companyId = companyResponse.body.data.resp.company_id;

        const customerResponse = await request(app)
            .post(`/api/v1/customer/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                name: "ABC Customer",
                contact_no: `98765${Date.now()}`
            });

        const customerId = customerResponse.body.data.Customer.customer_id;
        const contactNo = customerResponse.body.data.Customer.contact_no;

        const itemResponse1 = await createItem(owner.cookies, companyId, 10, 50000);
        const itemResponse2 = await createItem(owner.cookies, companyId, 10, 1000);

        const itemId1 = itemResponse1.body.data.result3.item_id;
        const itemId2 = itemResponse2.body.data.result3.item_id;

        const response = await request(app)
            .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
            .set("Cookie", owner.cookies)
            .send({
                date: "2026-09-28",
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

        const salesId = response.body.data.Voucher.sales_id;

        const response2 = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
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
            .get(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", owner.cookies);

        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response3.body.data.Vouchers.voucher_total_amt).toBe("180000");
        console.log(response3.body);
        console.log("Successfully tested sales total recalculation");
    });


    it("should reject non-existent sales voucher update", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company51");
        const companyId = companyResponse.body.data.resp.company_id;

        const response = await request(app)
            .patch(`/api/v1/sales-voucher/${companyId}/9999999`)
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
        console.log("Successfully tested non-existent sales voucher update");
    });


    it("should reject unauthenticated user during update", async () => {
        const response = await request(app)
            .patch("/api/v1/sales-voucher/1/1")
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
        console.log("Successfully rejected unauthenticated sales update");
    });


    it("should reject employee from updating sales voucher", async () => {
        const owner = await createUserAndLogin();
        const employee = await createUserAndLogin();

        const companyResponse = await createCompany(owner.cookies, "company52");
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
            .patch(`/api/v1/sales-voucher/${companyId}/${salesId}`)
            .set("Cookie", employee.cookies)
            .send({
                items: [
                    {
                        item_id: result.itemId,
                        qty: 5
                    }
                ]
            });

        expect(addEmployee.status).toBe(201);
        expect(result.response.status).toBe(201);
        expect(response.status).toBe(403);

        console.log(response.body);
        console.log("Successfully rejected employee sales update");
    });

});