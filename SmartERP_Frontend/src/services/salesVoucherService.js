import { api } from "./api.js";

export async function getAllSalesVouchers(companyId) {
  try {
    const res = await api.get(`/api/v1/sales-voucher/${companyId}`);
    return res.data?.Vouchers || [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return [];
    }
    throw err;
  }
}

export async function createSalesVoucher(companyId, customerId, contactNo, { date, items }) {
  const res = await api.post(`/api/v1/sales-voucher/${companyId}/${customerId}/${contactNo}`, {
    date,
    items,
  });
  return res.data?.Voucher;
}

export async function getOneSalesVoucher(companyId, salesId) {
  const res = await api.get(`/api/v1/sales-voucher/${companyId}/${salesId}`);
  return res.data?.Vouchers;
}

export async function updateSalesVoucher(companyId, salesId, { items }) {
  const res = await api.patch(`/api/v1/sales-voucher/${companyId}/${salesId}`, { items });
  return res.data;
}
