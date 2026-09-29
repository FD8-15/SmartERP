import { api } from "./api.js";

export async function getAllReceiptVouchers(companyId) {
  try {
    const res = await api.get(`/api/v1/receipt-voucher/${companyId}`);
    return Array.isArray(res.data?.receipt_voucher) ? res.data.receipt_voucher : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found") || err.message?.includes("No")) {
      return [];
    }
    throw err;
  }
}

export async function getReceiptsBySalesVoucher(companyId, salesId, customerId) {
  try {
    const res = await api.get(`/api/v1/receipt-voucher/${companyId}/${salesId}/${customerId}`);
    return Array.isArray(res.data?.receipt_voucher) ? res.data.receipt_voucher : [];
  } catch (err) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return [];
    }
    throw err;
  }
}

export async function createReceiptVoucher(companyId, salesId, { connect_no, current_amt_paid, date, mode }) {
  // Notice: The backend explicitly expects `connect_no` (with 'e') in req.body
  const res = await api.post(`/api/v1/receipt-voucher/${companyId}/${salesId}`, {
    connect_no,
    current_amt_paid,
    date,
    mode,
  });
  return res.data?.voucher;
}

export async function getOneReceiptVoucher(companyId, receiptId) {
  const res = await api.get(`/api/v1/receipt-voucher/${companyId}/${receiptId}`);
  return res.data?.receipt_voucher;
}

export async function updateReceiptVoucher(companyId, salesId, receiptId, { connect_no, current_amt_paid }) {
  const res = await api.patch(`/api/v1/receipt-voucher/${companyId}/${salesId}/${receiptId}`, {
    connect_no,
    current_amt_paid,
  });
  return res.data?.voucher;
}
