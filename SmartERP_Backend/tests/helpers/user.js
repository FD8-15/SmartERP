import request from "supertest";
import app from "../../src/app.js";

async function createUser() {
    let cookies;
    const email = `vitest_${Date.now()}@example.com`;
    await request(app)
        .post("/api/v1/users/register")
        .send({
            name: "Test User",
            email,
            password: "password123",
        });

        return{email}
}

async function loginUser(email) {
    let cookies;
    const response2 = await request(app)
        .post("/api/v1/users/login")
        .send({
            email,
            password: "password123"
        });

    cookies = response2.headers["set-cookie"];

    return { cookies};
}

async function createUserAndLogin() {
    const user = await createUser()
    const login = await loginUser(user.email)

    return {
        email: user.email,
        cookies: login.cookies
    }
}
export {createUser,loginUser,createUserAndLogin}
