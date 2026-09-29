import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllReceiptVouchers } from "../../services/receiptVoucherService.js";
import { getAllCustomers } from "../../services/customerService.js";
import Table from "../../components/common/Table.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function ReceiptVoucherList() {
  const { currentCompanyId } = useCompany();

  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [receiptsData, customersData] = await Promise.all([
        getAllReceiptVouchers(currentCompanyId),
        getAllCustomers(currentCompanyId),
      ]);
      setReceipts(receiptsData);
      setCustomers(customersData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load receipt vouchers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const customerMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));

  const columns = [
    {
      header: "Receipt #",
      key: "receipt_id",
      style: { width: 100 },
      render: (row) => <span className="mono" style={{ fontWeight: 700 }}>REC-{row.receipt_id}</span>,
    },
    {
      header: "Receipt Date",
      key: "date",
      render: (row) => <span className="mono">{formatDate(row.date)}</span>,
    },
    {
      header: "Against Sales Voucher",
      key: "sales_id",
      render: (row) => <span className="mono" style={{ fontWeight: 600 }}>SV-{row.sales_id}</span>,
    },
    {
      header: "Customer",
      key: "customer_id",
      render: (row) => {
        const cust = customerMap[row.customer_id];
        return cust ? cust.name : `Customer #${row.customer_id}`;
      },
    },
    {
      header: "Payment Mode",
      key: "mode",
      render: (row) => (
        <span className="badge badge-neutral" style={{ textTransform: "uppercase" }}>
          {row.mode}
        </span>
      ),
    },
    {
      header: "Amount Received",
      key: "amount_paid",
      align: "right",
      render: (row) => (
        <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: "var(--success)" }}>
          {formatCurrency(row.amount_paid)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipt Vouchers</h1>
          <div className="page-subtitle">Collections received from customers against sales invoices</div>
        </div>

        <div className="header-actions">
          <Link to="/receipt-vouchers/new" className="btn btn-primary">
            + Record Receipt (F6)
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={receipts}
        loading={loading}
        emptyMessage="No receipt vouchers recorded yet."
        keyField="receipt_id"
      />
    </div>
  );
}
