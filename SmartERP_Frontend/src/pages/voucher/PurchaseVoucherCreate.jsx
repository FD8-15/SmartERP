import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllSuppliers } from "../../services/supplierService.js";
import { getAllItems } from "../../services/itemService.js";
import { createPurchaseVoucher } from "../../services/purchaseVoucherService.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { formatCurrency, parseNumber } from "../../utils/formatCurrency.js";
import { getTodayDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";
import { Trash2, Plus } from "lucide-react";

export default function PurchaseVoucherCreate() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();

  const [suppliers, setSuppliers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [voucherDate, setVoucherDate] = useState(getTodayDate());
  const [lineItems, setLineItems] = useState([
    { item_id: "", qty: 1, unit_price: 0, line_total: 0 },
  ]);

  const loadPrerequisites = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [suppliersData, itemsData] = await Promise.all([
        getAllSuppliers(currentCompanyId),
        getAllItems(currentCompanyId),
      ]);
      setSuppliers(suppliersData);
      setItemsList(itemsData);
      if (suppliersData.length > 0) {
        setSelectedSupplierId(String(suppliersData[0].supplier_id));
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load master records"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadPrerequisites();
  }, [loadPrerequisites]);

  const itemsMap = Object.fromEntries(itemsList.map((i) => [i.item_id, i]));
  const selectedSupplier = suppliers.find((s) => String(s.supplier_id) === String(selectedSupplierId));

  function handleItemSelect(index, itemId) {
    const itm = itemsMap[itemId];
    const unitPrice = itm ? parseNumber(itm.default_purchase_price) : 0;
    
    setLineItems((prev) => {
      const updated = [...prev];
      const currentQty = updated[index].qty || 1;
      updated[index] = {
        item_id: itemId,
        qty: currentQty,
        unit_price: unitPrice,
        line_total: currentQty * unitPrice,
      };
      return updated;
    });
  }

  function handleQtyChange(index, qtyVal) {
    const qty = parseInt(qtyVal, 10);
    const validQty = isNaN(qty) || qty < 0 ? 0 : qty;

    setLineItems((prev) => {
      const updated = [...prev];
      const unitPrice = updated[index].unit_price || 0;
      updated[index] = {
        ...updated[index],
        qty: validQty,
        line_total: validQty * unitPrice,
      };
      return updated;
    });
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { item_id: "", qty: 1, unit_price: 0, line_total: 0 },
    ]);
  }

  function removeLineItem(index) {
    if (lineItems.length === 1) {
      setLineItems([{ item_id: "", qty: 1, unit_price: 0, line_total: 0 }]);
      return;
    }
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  const voucherTotal = lineItems.reduce((acc, row) => acc + (row.line_total || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSupplier) {
      setError("Please select a valid supplier");
      return;
    }

    if (!selectedSupplier.gst_no) {
      setError("Selected supplier has no GSTIN recorded. Please edit the supplier first.");
      return;
    }

    // Filter valid lines
    const validItems = lineItems
      .filter((line) => line.item_id && line.qty > 0)
      .map((line) => ({
        item_id: Number(line.item_id),
        qty: Number(line.qty),
      }));

    if (validItems.length === 0) {
      setError("Please select at least one item with quantity greater than 0");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createPurchaseVoucher(currentCompanyId, {
        date: voucherDate,
        gst_no: selectedSupplier.gst_no,
        items: validItems,
      });

      navigate("/purchase-vouchers");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to create purchase voucher"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading message="Loading suppliers and items..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Purchase Voucher (Inward)</h1>
          <div className="page-subtitle">Enter supplier invoice items to increase stock and record accounts payable</div>
        </div>

        <div className="header-actions">
          <Link to="/purchase-vouchers" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>

      <div className="keyboard-help-bar">
        <span className="kbd-item"><span className="kbd-hint">Tab</span> Next Field</span>
        <span className="kbd-item"><span className="kbd-hint">Alt + A</span> Add Item</span>
        <span className="kbd-item"><span className="kbd-hint">Enter</span> Submit</span>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {suppliers.length === 0 || itemsList.length === 0 ? (
        <div className="alert alert-danger">
          <strong>Cannot create voucher:</strong>
          {suppliers.length === 0 && <span> You need to add at least one <Link to="/suppliers">Supplier</Link>.</span>}
          {itemsList.length === 0 && <span> You need to add at least one <Link to="/items">Item</Link>.</span>}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        {/* Voucher Header Info */}
        <div className="voucher-header-card">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>
              <span>Supplier / Vendor</span>
              <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              required
              autoFocus
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.name} ({s.gst_no})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Invoice Date"
            name="voucherDate"
            type="date"
            value={voucherDate}
            onChange={(e) => setVoucherDate(e.target.value)}
            required
            style={{ marginBottom: 0 }}
          />

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Supplier GSTIN</label>
            <input
              type="text"
              className="form-control mono"
              value={selectedSupplier?.gst_no || ""}
              disabled
              placeholder="Auto-populated"
            />
          </div>
        </div>

        {/* Voucher Line Items */}
        <div className="voucher-items-section">
          <div className="voucher-section-title">
            <span>Invoice Line Items</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={addLineItem}
              icon={<Plus size={14} />}
            >
              Add Line Item (Alt+A)
            </Button>
          </div>

          <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Item / Product</th>
                  <th style={{ width: 120 }} className="text-center">Current Stock</th>
                  <th style={{ width: 140 }} className="text-right">Purchase Price (₹)</th>
                  <th style={{ width: 120 }} className="text-center">Quantity</th>
                  <th style={{ width: 160 }} className="text-right">Line Total (₹)</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => {
                  const itm = itemsMap[line.item_id];
                  return (
                    <tr key={idx}>
                      <td className="mono" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                      <td>
                        <select
                          className="voucher-table-input"
                          value={line.item_id}
                          onChange={(e) => handleItemSelect(idx, e.target.value)}
                          required
                        >
                          <option value="">Select Item</option>
                          {itemsList.map((i) => (
                            <option key={i.item_id} value={i.item_id}>
                              {i.item_name} [{i.sku}]
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center mono">
                        {itm ? (
                          <span className="badge badge-neutral">
                            {itm.current_quantity} in stock
                          </span>
                        ) : "-"}
                      </td>
                      <td className="text-right mono">
                        {itm ? formatCurrency(itm.default_purchase_price) : "₹0.00"}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="voucher-table-input text-center mono"
                          value={line.qty}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          required
                        />
                      </td>
                      <td className="text-right mono" style={{ fontWeight: 700 }}>
                        {formatCurrency(line.line_total)}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--danger)",
                            cursor: "pointer",
                            padding: 4
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voucher Total Summary & Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div style={{ maxWidth: 350, fontSize: 12, color: "var(--text-muted)" }}>
            * Note: Submitting this purchase voucher will automatically increase the recorded stock quantity in inventory for all listed items.
          </div>

          <div className="voucher-summary-card">
            <div className="summary-row">
              <span>Total Items</span>
              <span className="mono" style={{ fontWeight: 600 }}>{lineItems.filter((i) => i.item_id).length}</span>
            </div>
            <div className="summary-row total-row">
              <span>Grand Total</span>
              <span className="mono" style={{ color: "var(--primary)" }}>{formatCurrency(voucherTotal)}</span>
            </div>

            <div style={{ marginTop: 16 }}>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting || suppliers.length === 0 || itemsList.length === 0}
                style={{ width: "100%", padding: "10px 16px", fontSize: 14 }}
              >
                Post Purchase Voucher
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
