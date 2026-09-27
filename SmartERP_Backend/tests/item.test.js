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
                gst_percentage: "",
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
                gst_percentage: "      ",
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
                gst_percentage: -10,
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
                gst_percentage: 10,
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
                gst_percentage: 10,
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: -10,
                status: "active"
            })
        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested invalid feilds")
    })
    it("should reject category of different company", async () => {
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
        const response2 = await request(app)
            .post(`/api/v1/item/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse2.body.data.category_id,
                unit_id: unitResponse2.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const response3 = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse2.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(400);
        console.log(response.body)
        console.log(response2.body)
        console.log(response3.body)
        console.log("Successfully tested category of different company");
    })
    it("should reject unit of different company", async () => {
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
        const response2 = await request(app)
            .post(`/api/v1/item/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse2.body.data.category_id,
                unit_id: unitResponse2.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const response3 = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse2.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(400);
        console.log(response.body)
        console.log(response2.body)
        console.log(response3.body)
        console.log("Successfully tested unit of different company");
    })
    it("should get all items of same company", async () => {
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
        const response2 = await request(app)
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
        const response3 = await request(app)
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
        const response4 = await request(app)
            .get(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(201);
        expect(response4.status).toBe(200);
        console.log(response4.body)
        console.log("Successfully tested get all items of a company");
    })
    it("should get all items of requested  company", async () => {
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
        const response2 = await request(app)
            .post(`/api/v1/item/${companyId2}`)
            .set("Cookie", owner2.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse2.body.data.category_id,
                unit_id: unitResponse2.body.data.unit_id,
                gst_percentage: 18,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const response3 = await request(app)
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
        const response4 = await request(app)
            .get(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)

        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(201);
        expect(response4.status).toBe(200);
        expect(response4.body.data.length).toBe(2);
        expect(response4.body.data.every(item => item.company_id === companyId)).toBe(true);
        console.log(response4.body)
        console.log("Successfully tested get all items of a company");
    })

    it("should GET all items when the company has no items", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .get(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("No items found");
        console.log(response.body)
        console.log("Successfully tested no items in company")
    })

    it("should GET one item", async () => {
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
                gst_percentage: 10,
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
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response2.body.data.result3.item_id
        console.log("item_id:", item_id)
        const response3 = await request(app)
            .get(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(200);
        console.log(response3.body)
        console.log("Successfully tested get one item")
    })
    it("should reject non-existent item", async () => {
        const owner = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const response = await request(app)
            .get(`/api/v1/item/${companyId}/99999999`)
            .set("Cookie", owner.cookies)
        expect(response.status).toBe(404);
        console.log(response.body)
        console.log("Successfully tested item not found item")
    })
    it("should GET one item from a different company", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyResponse2 = await createCompany(owner2.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        console.log("item_id:", item_id)
        const response2 = await request(app)
            .get(`/api/v1/item/${companyId2}/${item_id}`)
            .set("Cookie", owner2.cookies)
        expect(response.status).toBe(201);
        expect(response2.status).toBe(404);
        console.log(response2.body)
        console.log("Successfully tested GET one item from a different company")
    })
})
describe("PATCH /api/v1/item/:company_id/:item_id", () => {
    it("should update the item", async () => {
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "MONITOR",
                sku: `SKU-${Date.now()}`,
                brand: "DELL",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.item_name).toBe("MONITOR");
        expect(response2.body.data.brand).toBe("DELL");
        console.log(response.body)
        console.log(response2.body)
        console.log("Successfully tested update item")
    })
    it("should reject duplicate SKU during update", async () => {
        const sku = `TEST-SKU-${Date.now()}`;
        const sku2 = `TEST2-SKU-${Date.now()}`;
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
                gst_percentage: 10,
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
                sku: sku2,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response3 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "MONITOR",
                sku: sku2,
                brand: "DELL",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response3.status).toBe(409);
        console.log(response3.body)
        console.log("Successfully tested reject duplicate SKU during update")
    })
    it("should update the item of same sku of item ", async () => {
        const sku = `SKU-${Date.now()}`
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "MONITOR",
                sku: sku,
                brand: "DELL",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(200);
        expect(response2.body.data.sku).toBe(sku);
        expect(response2.body.data.item_name).toBe("MONITOR");
        expect(response2.body.data.brand).toBe("DELL");
        console.log(response.body)
        console.log(response2.body)
        console.log("Successfully tested update of same sku item")
    })
    it("should Update a non-existent item ", async () => {
        const sku = `SKU-${Date.now()}`
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/9999999`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "MONITOR",
                sku: sku,
                brand: "DELL",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(404);
        console.log(response2.body)
        console.log("Successfully tested Update a non-existent item ")
    })
    it("should Update another company tries to update the item", async () => {
        const sku = `SKU-${Date.now()}`
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyResponse2 = await createCompany(owner2.cookies, "company10");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner2.cookies)
        expect(response.status).toBe(201);
        expect(response2.status).toBe(403);
        console.log(response2.body)
        console.log("Successfully testedanother company tries to update the item")
    })
    it("should Update Company A updating its item using Company B's category", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyResponse2 = await createCompany(owner2.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const categoryResponse = await createCategory(owner.cookies, companyId, "Eletronices")
        const categoryResponse2 = await createCategory(owner2.cookies, companyId2, "Eletronices")
        const response = await request(app)
            .post(`/api/v1/item/${companyId}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse2.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body)
        console.log("Successfully tested Update Company A updating its item using Company B's category ")
    })
    it("should Update Company A updating its item using Company B's unit", async () => {
        const owner = await createUserAndLogin();
        const owner2 = await createUserAndLogin();
        const companyResponse = await createCompany(owner.cookies, "company10");
        const companyResponse2 = await createCompany(owner2.cookies, "company11");
        const companyId = companyResponse.body.data.resp.company_id;
        const companyId2 = companyResponse2.body.data.resp.company_id;
        const unitResponse = await createUnit(owner.cookies, companyId, "KG");
        const unitResponse2 = await createUnit(owner2.cookies, companyId2, "KG");
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
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "Laptop",
                sku: `SKU-${Date.now()}`,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse2.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body)
        console.log("Successfully tested Update Company A updating its item using Company B's unit")
    })
    it("should reject empty item name during update", async () => {
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
                item_name: "",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })

        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested Update empty feild")
    })
    it("should reject ivalid gst percentage", async () => {
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
                item_name: "HP",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "HP",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: -10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body)
        console.log("Successfully tested Update gst invalid feild")
    })
    it("should reject negative purchase price in update item", async () => {
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
                item_name: "HP",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "HP",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: -50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body)
        console.log("Successfully tested reject negative purchase price in update item")
    })
    it("should reject negative selling_price in update item", async () => {
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
                item_name: "HP",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })
        const item_id = response.body.data.result3.item_id
        const response2 = await request(app)
            .patch(`/api/v1/item/${companyId}/${item_id}`)
            .set("Cookie", owner.cookies)
            .send({
                item_name: "HP",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: -60000,
                current_quantity: 10,
                status: "active"
            })
        expect(response.status).toBe(201);
        expect(response2.status).toBe(400);
        console.log(response2.body)
        console.log("Successfully tested reject negative selling_price in update item")
    })
     it("should reject whitespace field during update", async () => {
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
                item_name: "         ",
                sku: sku,
                brand: "HP",
                category_id: categoryResponse.body.data.category_id,
                unit_id: unitResponse.body.data.unit_id,
                gst_percentage: 10,
                default_purchase_price: 50000,
                default_selling_price: 60000,
                current_quantity: 10,
                status: "active"
            })

        expect(response.status).toBe(400);
        console.log(response.body)
        console.log("Successfully tested reject whitespace field during update")
    })


})
