import request from "supertest";
import app from "../../src/app.js";

let gstCounter = 0;

function createTestGST() {
    gstCounter++;

    const uniquePart = String(gstCounter).padStart(4, "0");

    return `30ABCDE${uniquePart}F1Z5`;
}

async function createSupplier(cookies, companyId) {
    const response = await request(app)
        .post(`/api/v1/supplier/${companyId}`)
        .set("Cookie", cookies)
        .send({
            name: "ABC Traders",
            contact_no: "9876543210",
            email: `supplier_${Date.now()}_${gstCounter}@example.com`,
            address: "123 Test Street",
            gst_no: createTestGST()
        });

    console.log("Supplier status:", response.status);
    console.log("Supplier response:", response.body);

    return response;
}

export { createSupplier };
