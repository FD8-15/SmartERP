import request from "supertest";
import app from "../../src/app.js";

let companyCounter = 1;
let companyGstCounter = 1;

export function getNextCompanyGST() {
    const pad = String(companyGstCounter++).padStart(4, "0");
    return `30ABCDE${pad}F1Z5`;
}

export function getNextCompanyName(prefix = "Company") {
    return `${prefix}_${companyCounter++}`;
}

async function createCompany(cookies, companyName = null) {
    const id = companyCounter++;
    const name = companyName || `Company_${id}`;
    const response = await request(app)
        .post("/api/v1/company")
        .set("Cookie", cookies)
        .send({
            company_name: name,
            email: `company_${id}@example.com`,
            address: "123 Test Street",
            contact_number: "9876543210",
            state: "Goa",
            gst_no: "30ABCDE1234F1Z5",
            financial_year_start: "2026-04-01",
            financial_year_end: "2027-03-31"
        });

    return response;
}

export { createCompany };
