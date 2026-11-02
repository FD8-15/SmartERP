import request from "supertest";
import app from "../../src/app.js";

let userCounter = 1;

export function getNextUserEmail(prefix = "vitest_user") {
    return `${prefix}_${Date.now()}_${userCounter++}@example.com`;
}

async function createUser(emailParam = null, password = "password123", name = "Test User") {
    const email = emailParam || getNextUserEmail();

    const response = await request(app)
        .post("/api/v1/users/register")
        .send({
            name,
            email,
            password
        });

    if (response.status !== 201) {
        throw new Error(
            `Test user registration failed: ${response.status} ${JSON.stringify(response.body)}`
        );
    }

    return { email, name };
}

async function loginUser(email, password = "password123") {
    const response = await request(app)
        .post("/api/v1/users/login")
        .send({
            email,
            password
        });

    if (response.status !== 200) {
        throw new Error(
            `Test user login failed: ${response.status} ${JSON.stringify(response.body)}`
        );
    }

    const cookies = response.headers["set-cookie"];

    return { cookies };
}

async function createUserAndLogin(emailParam = null, password = "password123") {
    const user = await createUser(emailParam, password);
    const login = await loginUser(user.email, password);

    return {
        email: user.email,
        cookies: login.cookies
    };
}

export { createUser, loginUser, createUserAndLogin };
