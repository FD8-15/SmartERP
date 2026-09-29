import { api } from "./api.js";

export async function getUnits(companyId) {
  try {
    const res = await api.get(`/api/v1/unit/${companyId}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("No units found")) {
      return [];
    }
    throw err;
  }
}

export async function createUnit(companyId, { unit_name }) {
  const res = await api.post(`/api/v1/unit/${companyId}`, { unit_name });
  return res.data;
}

export async function updateUnit(companyId, unitId, { unit_name }) {
  const res = await api.patch(`/api/v1/unit/${companyId}/${unitId}`, { unit_name });
  return res.data;
}
