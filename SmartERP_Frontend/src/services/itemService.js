import { api } from "./api.js";

export async function getAllItems(companyId) {
  try {
    const res = await api.get(`/api/v1/item/${companyId}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("No items found")) {
      return [];
    }
    throw err;
  }
}

export async function createItem(companyId, itemData) {
  const res = await api.post(`/api/v1/item/${companyId}`, itemData);
  return res.data?.result3;
}

export async function getOneItem(companyId, itemId) {
  const res = await api.get(`/api/v1/item/${companyId}/${itemId}`);
  return res.data;
}

export async function updateItem(companyId, itemId, itemData) {
  const res = await api.patch(`/api/v1/item/${companyId}/${itemId}`, itemData);
  return res.data;
}
