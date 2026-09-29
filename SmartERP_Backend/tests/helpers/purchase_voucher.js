import request from "supertest";
import app from "../../src/app.js";
import { createSupplier } from "./supplier.js";
import { createItem } from "./item.js";

async function createPurchaseVoucher(cookies, companyId, quantity = 2, purchasePrice = 50000) {
    const supplierResponse = await createSupplier(cookies, companyId);
    const itemResponse = await createItem(cookies, companyId, 10, purchasePrice);
    const supplierGst = supplierResponse.body.data.supplier.gst_no;
    const itemId = itemResponse.body.data.result3.item_id;

    const response = await request(app)
        .post(`/api/v1/purchase-voucher/${companyId}`)
        .set("Cookie", cookies)
        .send({
            date: "2026-09-28",
            gst_no: supplierGst,
            items: [
                {
                    item_id: itemId,
                    qty: quantity
                }
            ]
        });

    return response;
}

export { createPurchaseVoucher };