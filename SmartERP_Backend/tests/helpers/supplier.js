import request from "supertest";
import app from "../../src/app.js";
async function createSupplier(cookies, companyId) {
    const response = await request(app)
        .post(`/api/v1/supplier/${companyId}`)
        .set("Cookie", cookies)
        .send({
            name: "ABC Traders",
            contact_no: "9876543210",
            email: `supplier_${Date.now()}@example.com`,
            address: "123 Test Street",
            gst_no: `30ABCDE${Date.now()}`
        });
    return response;
}
export {createSupplier};

