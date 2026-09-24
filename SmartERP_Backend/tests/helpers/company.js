import request from "supertest";
import app from "../../src/app.js";
async function createCompany(cookies, companyName) {

    const response = await request(app)
        .post("/api/v1/company")
        .set("Cookie", cookies)
        .send({
            company_name: companyName,
            email: `company_${Date.now()}@example.com`,
            address: "123 Test Street",
            contact_number: "9876543210",
            state: "Goa",
            gst_no: "30ABCDE1234F1Z5",
            financial_year_start: "2026-04-01",
            financial_year_end: "2027-03-31"
        });

    return response;
}
export{createCompany}