import { api } from "./api.js";

export async function getAllSuppliers(companyId) {
  try {
    const res = await api.get(`/api/v1/supplier/${companyId}`);
    return res.data?.suppliers || [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return [];
    }
    throw err;
  }
}

export async function createSupplier(companyId, supplierData) {
  const res = await api.post(`/api/v1/supplier/${companyId}`, supplierData);
  return res.data?.supplier;
}

export async function getOneSupplier(companyId, supplierId) {
  const res = await api.get(`/api/v1/supplier/${companyId}/${supplierId}`);
  return res.data?.supplier;
}

export async function updateSupplier(companyId, supplierId, supplierData) {
  const res = await api.patch(`/api/v1/supplier/${companyId}/${supplierId}`, supplierData);
  return res.data?.supplierUpdated;
}
