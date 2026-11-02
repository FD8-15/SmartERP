import request from "supertest";
import app from "../../src/app.js";

let unitCounter = 1;

export function getNextUnitName(prefix = "UNIT") {
    return `${prefix}_${unitCounter++}`;
}

async function createUnit(cookies, companyId, unitName = null) {
    const name = unitName || getNextUnitName();
    const response = await request(app)
        .post(`/api/v1/unit/${companyId}`)
        .set("Cookie", cookies)
        .send({
            unit_name: name
        });

    return response;
}

export { createUnit };
