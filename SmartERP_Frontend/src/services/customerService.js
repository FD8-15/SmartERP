import { api } from "./api.js";

export async function getAllCustomers(companyId) {
  try {
    const res = await api.get(`/api/v1/customer/${companyId}`);
    return res.data?.customers || [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return [];
    }
    throw err;
  }
}

export async function createCustomer(companyId, { name, contact_no }) {
  const res = await api.post(`/api/v1/customer/${companyId}`, { name, contact_no });
  return res.data?.Customer;
}

export async function getOneCustomer(companyId, customerId) {
  const res = await api.get(`/api/v1/customer/${companyId}/${customerId}`);
  return res.data?.customer;
}

export async function updateCustomer(companyId, customerId, { name, contact_no }) {
  const res = await api.patch(`/api/v1/customer/${companyId}/${customerId}`, { name, contact_no });
  return res.data?.customerUpdated;
}
