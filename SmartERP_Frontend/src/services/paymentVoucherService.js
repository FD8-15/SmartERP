import { api } from "./api.js";

export async function getAllPaymentVouchers(companyId) {
  try {
    const res = await api.get(`/api/v1/payment-voucher/${companyId}`);
    return Array.isArray(res.data?.voucher) ? res.data.voucher : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found") || err.message?.includes("No")) {
      return [];
    }
    throw err;
  }
}

export async function getPaymentsByPurchaseVoucher(companyId, voucherId, supplierId) {
  try {
    const res = await api.get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`);
    return Array.isArray(res.data?.voucher) ? res.data.voucher : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return [];
    }
    throw err;
  }
}

export async function createPaymentVoucher(companyId, voucherId, supplierId, { paid_amt, date, mode }) {
  const res = await api.post(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}`, {
    paid_amt,
    date,
    mode,
  });
  return res.data?.Voucher;
}

export async function getOnePaymentVoucher(companyId, voucherId, supplierId, paymentId) {
  const res = await api.get(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/${paymentId}`);
  return res.data?.voucher;
}

export async function updatePaymentVoucher(companyId, voucherId, supplierId, paymentId, { amtNew }) {
  const res = await api.patch(`/api/v1/payment-voucher/${companyId}/${voucherId}/${supplierId}/${paymentId}`, {
    amtNew,
  });
  return res.data?.voucher;
}
