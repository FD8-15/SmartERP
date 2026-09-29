import { api } from "./api.js";

export async function getAllPurchaseVouchers(companyId) {
  try {
    const res = await api.get(`/api/v1/purchase-voucher/${companyId}`);
    return res.data?.AllVouchers || [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return [];
    }
    throw err;
  }
}

export async function createPurchaseVoucher(companyId, { date, gst_no, items }) {
  const res = await api.post(`/api/v1/purchase-voucher/${companyId}`, { date, gst_no, items });
  return res.data; // { voucher, items }
}

export async function getOnePurchaseVoucher(companyId, voucherId) {
  const res = await api.get(`/api/v1/purchase-voucher/${companyId}/${voucherId}`);
  return res.data?.Voucher;
}

export async function updatePurchaseVoucher(companyId, voucherId, { items }) {
  const res = await api.patch(`/api/v1/purchase-voucher/${companyId}/${voucherId}`, { items });
  return res.data;
}
