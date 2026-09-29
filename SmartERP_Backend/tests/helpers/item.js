import request from "supertest";
import app from "../../src/app.js";
import { createUnit } from "./unit.js";
import { createCategory } from "./category.js";

async function createItem(cookies, companyId, quantity = 10, purchasePrice = 50000) {
    const unique = `${Date.now()}-${Math.random()}`;
    const unitResponse = await createUnit(cookies, companyId, `KG-${unique}`);
    const categoryResponse = await createCategory(cookies, companyId, `Electronics-${unique}`);
    const response = await request(app)
        .post(`/api/v1/item/${companyId}`)
        .set("Cookie", cookies)
        .send({
            item_name: "Laptop",
            sku: `SKU-${Date.now()}`,
            brand: "HP",
            category_id: categoryResponse.body.data.category_id,
            unit_id: unitResponse.body.data.unit_id,
            gst_percentage: 18,
            default_purchase_price: purchasePrice,
            default_selling_price: 60000,
            current_quantity: quantity,
            status: "active"
        });
    return response;
}
export { createItem };

