import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllPurchaseVouchers, getOnePurchaseVoucher } from "../../services/purchaseVoucherService.js";
import { getAllSuppliers } from "../../services/supplierService.js";
import { getAllItems } from "../../services/itemService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function PurchaseVoucherList() {
  const { currentCompanyId } = useCompany();

  const [vouchers, setVouchers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVoucherRows, setSelectedVoucherRows] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  const loadData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [vouchersData, suppliersData, itemsData] = await Promise.all([
        getAllPurchaseVouchers(currentCompanyId),
        getAllSuppliers(currentCompanyId),
        getAllItems(currentCompanyId),
      ]);
      setVouchers(vouchersData);
      setSuppliers(suppliersData);
      setItems(itemsData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load purchase vouchers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.supplier_id, s]));
  const itemMap = Object.fromEntries(items.map((i) => [i.item_id, i]));

  async function handleViewDetails(voucherId) {
    setViewLoading(true);
    setViewError("");
    setSelectedVoucherRows([]);
    setViewModalOpen(true);

    try {
      const details = await getOnePurchaseVoucher(currentCompanyId, voucherId);
      // details is an array of joined rows { voucher_id, date, supplier_id, voucher_total_amt, item_id, qty, line_total_amt }
      setSelectedVoucherRows(Array.isArray(details) ? details : [details]);
    } catch (err) {
      setViewError(extractErrorMessage(err, "Failed to load voucher details"));
    } finally {
      setViewLoading(false);
    }
  }

  const columns = [
    {
      header: "Voucher #",
      key: "voucher_id",
      style: { width: 100 },
      render: (row) => <span className="mono" style={{ fontWeight: 700 }}>PV-{row.voucher_id}</span>,
    },
    {
      header: "Date",
      key: "date",
      render: (row) => <span className="mono">{formatDate(row.date)}</span>,
    },
    {
      header: "Supplier",
      key: "supplier_id",
      render: (row) => {
        const sup = supplierMap[row.supplier_id];
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{sup ? sup.name : `Supplier #${row.supplier_id}`}</div>
            {sup && <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>GST: {sup.gst_no}</div>}
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
      render: (row) => (
        <div style={{ display: "inline-flex", gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetails(row.voucher_id)}
          >
            View Details
          </Button>
          <Link
            to={`/payment-vouchers/new?voucher_id=${row.voucher_id}&supplier_id=${row.supplier_id}`}
            className="btn btn-primary btn-sm"
          >
            Pay Voucher
          </Link>
        </div>
      ),
    },
  ];

  const headerVoucher = selectedVoucherRows[0];
  const supDetails = headerVoucher ? supplierMap[headerVoucher.supplier_id] : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Vouchers</h1>
          <div className="page-subtitle">Record supplier inward stock receipts and purchase bills</div>
        </div>

        <div className="header-actions">
          <Link to="/purchase-vouchers/new" className="btn btn-primary">
            + New Purchase Voucher (F9)
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={vouchers}
        loading={loading}
        emptyMessage="No purchase vouchers found. Click '+ New Purchase Voucher' to record a purchase."
        keyField="voucher_id"
      />

      {/* View Voucher Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={headerVoucher ? `Purchase Voucher PV-${headerVoucher.voucher_id}` : "Voucher Details"}
        size="lg"
      >
        <ErrorMessage message={viewError} onDismiss={() => setViewError("")} />

        {viewLoading ? (
          <Loading message="Loading voucher breakdown..." />
        ) : headerVoucher ? (
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
                <div className="mono" style={{ fontWeight: 600 }}>{formatDate(headerVoucher.date)}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Supplier</div>
                <div style={{ fontWeight: 600 }}>{supDetails ? supDetails.name : `#${headerVoucher.supplier_id}`}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Supplier GSTIN</div>
                <div className="mono" style={{ fontWeight: 600, color: "var(--primary)" }}>
                  {supDetails?.gst_no || "-"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Invoice Amount</div>
                <div className="mono" style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>
                  {formatCurrency(headerVoucher.voucher_total_amt)}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: 13, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", color: "#475569" }}>
              Purchased Line Items
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
                  {selectedVoucherRows.map((item, idx) => {
                    const itm = itemMap[item.item_id];
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{itm?.item_name || `Item #${item.item_id}`}</div>
                          {itm?.sku && <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>SKU: {itm.sku}</div>}
                        </td>
                        <td className="text-center mono" style={{ fontWeight: 600 }}>
                          {item.qty}
                        </td>
                        <td className="text-right mono" style={{ fontWeight: 600 }}>
                          {formatCurrency(item.line_total_amt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ margin: "16px -20px -20px", padding: "12px 20px" }}>
              <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
              <Link
                to={`/payment-vouchers/new?voucher_id=${headerVoucher.voucher_id}&supplier_id=${headerVoucher.supplier_id}`}
                className="btn btn-primary"
              >
                Make Payment
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
