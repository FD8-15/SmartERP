import { api } from "./api.js";

export async function registerUser({ name, email, password }) {
  const res = await api.post("/api/v1/users/register", { name, email, password });
  return res.data; // { user_id, name, email }
}

export async function loginUser({ email, password }) {
  const res = await api.post("/api/v1/users/login", { email, password });
  return res.user; // { user_id, name, email }
}

export async function logoutUser() {
  const res = await api.post("/api/v1/users/logout");
  return res;
}
