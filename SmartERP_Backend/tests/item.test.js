import { createUser, loginUser, createUserAndLogin } from "./helpers/user.js";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createCompany } from "./helpers/company.js";
import { createUnit } from "./helpers/unit.js";
import { createCategory } from "./helpers/category.js";

describe("POST /api/v1/item/:company_id", () => {

    it("should create item", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        console.log(response.body)
        console.log("Successfully tested create items")
    })
    it("should check duplicate sku", async () => {
        const sku = `TEST-SKU-${Date.now()}`;
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const response2 = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(409);
        console.log(response2.body)
        console.log("Successfully tested duplicate items sku")
    })
    it("should create item of same sku in different company", async () => {
        const sku = `TEST-SKU-${Date.now()}`;
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyResponse2 = await createCompany(owner2.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const unitResponse2 = await createUnit(owner2.cookies, companyId2, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const categoryResponse2 = await createCategory(owner2.cookies, companyId2, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const response2 = await request(app)
            .post(`/api/v1/item/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                item_name: "Laptop",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse2.body.data.category_id,
                unit_id: unitResponse2.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        console.log(response.body)
        console.log(response2.body)
        console.log("Successfully tested same sku in different company")
    })
    it("should reject item when required field is empty", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage:"" ,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested missing feilds")
    })
    it("should reject item when required field is whitespaced", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage:"      " ,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested missing feilds")
    })
    it("should reject item when required field is invalid numeric values", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage:-10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested invalid feilds")
    })
    it("should reject item when default_purchase_price is invalid numeric values", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage:10,
                default_purchase_price: -50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested invalid feilds")
    })
    it("should reject item when default_selling_price is invalid numeric values", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage:10,
                default_purchase_price: 50000,
                default_selling_price: -60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested invalid feilds")
    })
    it("should reject item when current_quantity is invalid numeric values", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage:10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: -10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested invalid feilds")
    })

})