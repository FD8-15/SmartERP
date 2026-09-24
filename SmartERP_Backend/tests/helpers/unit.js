import request from "supertest";
import app from "../../src/app.js";

async function createUnit(cookies, companyId, unitName = `KG-${Date.now()}`) {
    const response = await request(app)
        .post(`/api/v1/unit/${companyId}`)
        .set("Cookie", cookies)
        .send({
            unit_name: unitName
        });

    return response;
}

export { createUnit };