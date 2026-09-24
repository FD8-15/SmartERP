import request from "supertest";
import app from "../../src/app.js";

async function createCategory(cookies, companyId, categoryName = `Category-${Date.now()}`) {
    const response = await request(app)
        .post(`/api/v1/category/${companyId}`)
        .set("Cookie", cookies)
        .send({
            category_name: categoryName
        });

    return response;
}

export { createCategory };
