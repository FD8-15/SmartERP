import request from "supertest";
import app from "../../src/app.js";
import { randomUUID } from "node:crypto";

async function createUser() {
    const email = `vitest_${randomUUID()}@example.com`;

    const response = await request(app)
        .post("/api/v1/users/register")
        .send({
            name: "Test User",
            email,
            password: "password123",
        });

    if (response.status !== 201) {
        throw new Error(
            `Test user registration failed: ${response.status} ${JSON.stringify(response.body)}`
        );
    }

    return { email };
}

async function loginUser(email) {
    const response = await request(app)
        .post("/api/v1/users/login")
        .send({
            email,
            password: "password123"
        });

    if (response.status !== 200) {
        throw new Error(
            `Test user login failed: ${response.status} ${JSON.stringify(response.body)}`
        );
    }

    const cookies = response.headers["set-cookie"];

    return { cookies };
}

async function createUserAndLogin() {
    const user = await createUser();
    const login = await loginUser(user.email);

    return {
        email: user.email,
        cookies: login.cookies
    };
}

export { createUser, loginUser, createUserAndLogin };