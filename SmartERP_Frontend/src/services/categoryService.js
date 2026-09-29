import { api } from "./api.js";

export async function getCategories(companyId) {
  try {
    const res = await api.get(`/api/v1/category/${companyId}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("No categories found")) {
      return [];
    }
    throw err;
  }
}

export async function createCategory(companyId, { category_name }) {
  const res = await api.post(`/api/v1/category/${companyId}`, { category_name });
  return res.data;
}

export async function updateCategory(companyId, categoryId, { category_name }) {
  const res = await api.patch(`/api/v1/category/${companyId}/${categoryId}`, { category_name });
  return res.data;
}

export async function deleteCategory(companyId, categoryId) {
  const res = await api.delete(`/api/v1/category/${companyId}/${categoryId}`);
  return res.data;
}
