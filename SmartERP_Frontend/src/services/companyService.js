import { api } from "./api.js";

export async function getAllCompanies() {
  try {
    const res = await api.get("/api/v1/company");
    return res.data?.result2 || [];
  } catch (err) {
    if (err.message && err.message.includes("No companies found")) {
      return [];
    }
    throw err;
  }
}

export async function createCompany(companyData) {
  const res = await api.post("/api/v1/company", companyData);
  return res.data?.resp;
}

export async function getCompanyDetails(companyId) {
  const res = await api.get(`/api/v1/company/${companyId}`);
  return res.data?.result2;
}

export async function updateCompany(companyId, companyData) {
  const res = await api.patch(`/api/v1/company/${companyId}`, companyData);
  return res.data?.result2;
}

export async function addCompanyUser(companyId, { email, role }) {
  const res = await api.post(`/api/v1/company/${companyId}/users`, { email, role });
  return res.data?.result3;
}
