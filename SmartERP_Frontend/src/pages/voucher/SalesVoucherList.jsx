import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllSalesVouchers, getOneSalesVoucher } from "../../services/salesVoucherService.js";
import { getAllCustomers } from "../../services/customerService.js";
import { getAllItems } from "../../services/itemService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function SalesVoucherList() {
  const { currentCompanyId } = useCompany();

  const [vouchers, setVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVoucherData, setSelectedVoucherData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [vouchersData, customersData, itemsData] = await Promise.all([
        getAllSalesVouchers(currentCompanyId),
        getAllCustomers(currentCompanyId),
        getAllItems(currentCompanyId),
      ]);
      setVouchers(vouchersData);
      setCustomers(customersData);
      setItems(itemsData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load sales vouchers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const customerMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));
  const itemMap = Object.fromEntries(items.map((i) => [i.item_id, i]));

  async function handleViewDetails(salesId) {
    setViewLoading(true);
    setViewError("");
    setSelectedVoucherData(null);
    setViewModalOpen(true);

    try {
      const details = await getOneSalesVoucher(currentCompanyId, salesId);
      // details is an object: { sales_id, company_id, customer_id, voucher_total_amt, date, sales_items_id, item_id, qty, line_total_amt }
      setSelectedVoucherData(details);
    } catch (err) {
      setViewError(extractErrorMessage(err, "Failed to load sales voucher details"));
    } finally {
      setViewLoading(false);
    }
  }

  const columns = [
    {
      header: "Sales #",
      key: "sales_id",
      style: { width: 100 },
      render: (row) => <span className="mono" style={{ fontWeight: 700 }}>SV-{row.sales_id}</span>,
    },
    {
      header: "Date",
      key: "date",
      render: (row) => <span className="mono">{formatDate(row.date)}</span>,
    },
    {
      header: "Customer",
      key: "customer_id",
      render: (row) => {
        const cust = customerMap[row.customer_id];
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{cust ? cust.name : `Customer #${row.customer_id}`}</div>
            {cust && <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>Ph: {cust.contact_no}</div>}
          </div>
        );
      },
    },
    {
      header: "Total Amount",
      key: "total_amt",
      align: "right",
      render: (row) => (
        <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>
          {formatCurrency(row.total_amt)}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (row) => {
        const cust = customerMap[row.customer_id];
        return (
          <div style={{ display: "inline-flex", gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleViewDetails(row.sales_id)}
            >
              View
            </Button>
            <Link
              to={`/receipt-vouchers/new?sales_id=${row.sales_id}&customer_id=${row.customer_id}&contact_no=${cust ? cust.contact_no : ""}`}
              className="btn btn-primary btn-sm"
            >
              Receive Payment
            </Link>
          </div>
        );
      },
    },
  ];

  const custDetails = selectedVoucherData ? customerMap[selectedVoucherData.customer_id] : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Vouchers</h1>
          <div className="page-subtitle">Customer sales invoices, stock reduction, and accounts receivable</div>
        </div>

        <div className="header-actions">
          <Link to="/sales-vouchers/new" className="btn btn-primary">
            + New Sales Voucher (F8)
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={vouchers}
        loading={loading}
        emptyMessage="No sales vouchers recorded yet. Click '+ New Sales Voucher' to make a sale."
        keyField="sales_id"
      />

      {/* View Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedVoucherData ? `Sales Voucher SV-${selectedVoucherData.sales_id}` : "Sales Voucher Details"}
        size="lg"
      >
        <ErrorMessage message={viewError} onDismiss={() => setViewError("")} />

        {viewLoading ? (
          <Loading message="Loading sales voucher..." />
        ) : selectedVoucherData ? (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              padding: "12px 16px",
              background: "var(--bg-main)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 16
            }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Voucher Date</div>
                <div className="mono" style={{ fontWeight: 600 }}>{formatDate(selectedVoucherData.date)}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{custDetails ? custDetails.name : `#${selectedVoucherData.customer_id}`}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Contact Phone</div>
                <div className="mono" style={{ fontWeight: 600 }}>{custDetails?.contact_no || "-"}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Invoice Total</div>
                <div className="mono" style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>
                  {formatCurrency(selectedVoucherData.voucher_total_amt)}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", color: "#475569" }}>
              Sold Item Breakdown
            </h4>

            <div className="table-container" style={{ marginBottom: 16 }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {itemMap[selectedVoucherData.item_id]?.item_name || `Item #${selectedVoucherData.item_id}`}
                      </div>
                      {itemMap[selectedVoucherData.item_id]?.sku && (
                        <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          SKU: {itemMap[selectedVoucherData.item_id].sku}
                        </div>
                      )}
                    </td>
                    <td className="text-center mono" style={{ fontWeight: 600 }}>
                      {selectedVoucherData.qty}
                    </td>
                    <td className="text-right mono" style={{ fontWeight: 600 }}>
                      {formatCurrency(selectedVoucherData.line_total_amt)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ margin: "16px -20px -20px", padding: "12px 20px" }}>
              <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
              <Link
                to={`/receipt-vouchers/new?sales_id=${selectedVoucherData.sales_id}&customer_id=${selectedVoucherData.customer_id}&contact_no=${custDetails?.contact_no || ""}`}
                className="btn btn-primary"
              >
                Receive Payment
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
