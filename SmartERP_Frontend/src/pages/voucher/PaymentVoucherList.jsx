import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllPaymentVouchers } from "../../services/paymentVoucherService.js";
import { getAllSuppliers } from "../../services/supplierService.js";
import Table from "../../components/common/Table.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function PaymentVoucherList() {
  const { currentCompanyId } = useCompany();

  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [paymentsData, suppliersData] = await Promise.all([
        getAllPaymentVouchers(currentCompanyId),
        getAllSuppliers(currentCompanyId),
      ]);
      setPayments(paymentsData);
      setSuppliers(suppliersData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load payment vouchers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.supplier_id, s]));

  const columns = [
    {
      header: "Payment #",
      key: "payment_id",
      style: { width: 100 },
      render: (row) => <span className="mono" style={{ fontWeight: 700 }}>PAY-{row.payment_id}</span>,
    },
    {
      header: "Payment Date",
      key: "date",
      render: (row) => <span className="mono">{formatDate(row.date)}</span>,
    },
    {
      header: "Against Purchase Voucher",
      key: "voucher_id",
      render: (row) => <span className="mono" style={{ fontWeight: 600 }}>PV-{row.voucher_id}</span>,
    },
    {
      header: "Supplier",
      key: "supplier_id",
      render: (row) => {
        const sup = supplierMap[row.supplier_id];
        return sup ? sup.name : `Supplier #${row.supplier_id}`;
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
      header: "Amount Paid",
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
          <h1 className="page-title">Payment Vouchers</h1>
          <div className="page-subtitle">Disbursements made to suppliers against purchase bills</div>
        </div>

        <div className="header-actions">
          <Link to="/payment-vouchers/new" className="btn btn-primary">
            + Record Payment (F5)
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payment vouchers recorded yet."
        keyField="payment_id"
      />
    </div>
  );
}
