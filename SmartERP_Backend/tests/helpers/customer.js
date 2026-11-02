import request from "supertest";
import app from "../../src/app.js";

let phoneCounter = 0;

function createTestPhone() {
    phoneCounter++;
    const uniquePart = String(phoneCounter).padStart(8, "0");
    return `98${uniquePart}`;
}

async function createCustomer(cookies, companyId, name = "ABC Customer", contactNo = null) {
    const phone = contactNo || createTestPhone();
    const response = await request(app)
        .post(`/api/v1/customer/${companyId}`)
        .set("Cookie", cookies)
        .send({
            name,
            contact_no: phone
        });
    return response;
}

export { createCustomer, createTestPhone };
