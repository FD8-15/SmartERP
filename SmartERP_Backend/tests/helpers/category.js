import request from "supertest";
import app from "../../src/app.js";

let categoryCounter = 1;

export function getNextCategoryName(prefix = "Category") {
    return `${prefix}_${categoryCounter++}`;
}

async function createCategory(cookies, companyId, categoryName = null) {
    const name = categoryName || getNextCategoryName();
    const response = await request(app)
        .post(`/api/v1/category/${companyId}`)
        .set("Cookie", cookies)
        .send({
            category_name: name
        });

    return response;
}

export { createCategory };
