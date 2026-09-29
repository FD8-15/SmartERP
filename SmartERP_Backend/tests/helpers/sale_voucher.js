import request from "supertest";
import app from "../../src/app.js";
import { createItem } from "./item.js";

async function createSalesVoucher(cookies, companyId, quantity = 2, sellingPrice = 60000) {
    const customerResponse = await request(app)
        .post(`/api/v1/customer/${companyId}`)
        .set("Cookie", cookies)
        .send({
            name: "ABC Customer",
            contact_no: `98765${Date.now()}`
        });

    const customerId = customerResponse.body.data.Customer.customer_id;
    const contactNo = customerResponse.body.data.Customer.contact_no;

    const itemResponse = await createItem(cookies, companyId, 10, 50000);
    const itemId = itemResponse.body.data.result3.item_id;

    const response = await request(app)
        .post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`)
        .set("Cookie", cookies)
        .send({
            date: "2026-09-28",
            items: [
                {
                    item_id: itemId,
                    qty: quantity
                }
            ]
        });

    return {
        response,
        customerId,
        contactNo,
        itemId
    };
}

export {
    createSalesVoucher
};