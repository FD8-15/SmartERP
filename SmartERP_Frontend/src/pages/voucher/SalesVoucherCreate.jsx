import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllCustomers } from "../../services/customerService.js";
import { getAllItems } from "../../services/itemService.js";
import { createSalesVoucher } from "../../services/salesVoucherService.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { formatCurrency, parseNumber } from "../../utils/formatCurrency.js";
import { getTodayDate } from "../../utils/formatDate.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";
import { Trash2, Plus } from "lucide-react";

export default function SalesVoucherCreate() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();

  const [customers, setCustomers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [voucherDate, setVoucherDate] = useState(getTodayDate());
  const [lineItems, setLineItems] = useState([
    { item_id: "", qty: 1, unit_price: 0, line_total: 0, current_stock: 0 },
  ]);

  const loadPrerequisites = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [customersData, itemsData] = await Promise.all([
        getAllCustomers(currentCompanyId),
        getAllItems(currentCompanyId),
      ]);
      setCustomers(customersData);
      setItemsList(itemsData);
      if (customersData.length > 0) {
        setSelectedCustomerId(String(customersData[0].customer_id));
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
  const selectedCustomer = customers.find((c) => String(c.customer_id) === String(selectedCustomerId));

  function handleItemSelect(index, itemId) {
    const itm = itemsMap[itemId];
    const unitPrice = itm ? parseNumber(itm.default_selling_price) : 0;
    const stock = itm ? parseNumber(itm.current_quantity) : 0;

    setLineItems((prev) => {
      const updated = [...prev];
      const currentQty = updated[index].qty || 1;
      updated[index] = {
        item_id: itemId,
        qty: currentQty,
        unit_price: unitPrice,
        line_total: currentQty * unitPrice,
        current_stock: stock,
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
      { item_id: "", qty: 1, unit_price: 0, line_total: 0, current_stock: 0 },
    ]);
  }

  function removeLineItem(index) {
    if (lineItems.length === 1) {
      setLineItems([{ item_id: "", qty: 1, unit_price: 0, line_total: 0, current_stock: 0 }]);
      return;
    }
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  const voucherTotal = lineItems.reduce((acc, row) => acc + (row.line_total || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }

    if (!selectedCustomer.contact_no) {
      setError("Selected customer does not have a contact number. Please edit customer.");
      return;
    }

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

    // Client-side stock check warning
    for (const item of validItems) {
      const itm = itemsMap[item.item_id];
      if (itm && item.qty > itm.current_quantity) {
        setError(`Cannot sell ${item.qty} units of '${itm.item_name}'. Available stock is only ${itm.current_quantity}.`);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      await createSalesVoucher(
        currentCompanyId,
        selectedCustomer.customer_id,
        selectedCustomer.contact_no,
        {
          date: voucherDate,
          items: validItems,
        }
      );

      navigate("/sales-vouchers");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to create sales voucher"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading message="Loading customers and inventory items..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Sales Voucher (Outward)</h1>
          <div className="page-subtitle">Generate customer invoice, calculate line totals, and decrease live stock</div>
        </div>

        <div className="header-actions">
          <Link to="/sales-vouchers" className="btn btn-secondary">
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

      {customers.length === 0 || itemsList.length === 0 ? (
        <div className="alert alert-danger">
          <strong>Cannot create sales voucher:</strong>
          {customers.length === 0 && <span> You need to add at least one <Link to="/customers">Customer</Link>.</span>}
          {itemsList.length === 0 && <span> You need to add at least one <Link to="/items">Item</Link>.</span>}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        {/* Voucher Header Info */}
        <div className="voucher-header-card">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>
              <span>Customer</span>
              <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              autoFocus
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} ({c.contact_no})
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
            <label>Customer Contact</label>
            <input
              type="text"
              className="form-control mono"
              value={selectedCustomer?.contact_no || ""}
              disabled
              placeholder="Auto-populated"
            />
          </div>
        </div>

        {/* Voucher Line Items */}
        <div className="voucher-items-section">
          <div className="voucher-section-title">
            <span>Sales Line Items</span>
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
                  <th style={{ width: 140 }} className="text-center">Available Stock</th>
                  <th style={{ width: 140 }} className="text-right">Selling Price (₹)</th>
                  <th style={{ width: 120 }} className="text-center">Quantity</th>
                  <th style={{ width: 160 }} className="text-right">Line Total (₹)</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => {
                  const itm = itemsMap[line.item_id];
                  const stock = itm ? itm.current_quantity : 0;
                  const isStockInsufficient = itm && line.qty > stock;

                  return (
                    <tr key={idx} style={{ backgroundColor: isStockInsufficient ? "#fff1f2" : undefined }}>
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
                              {i.item_name} [{i.sku}] (Stock: {i.current_quantity})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center mono">
                        {itm ? (
                          <span className={`badge ${stock > 0 ? "badge-success" : "badge-danger"}`}>
                            {stock} available
                          </span>
                        ) : "-"}
                      </td>
                      <td className="text-right mono">
                        {itm ? formatCurrency(itm.default_selling_price) : "₹0.00"}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="voucher-table-input text-center mono"
                          value={line.qty}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          required
                          style={isStockInsufficient ? { borderColor: "var(--danger)" } : {}}
                        />
                        {isStockInsufficient && (
                          <div style={{ color: "var(--danger)", fontSize: 10, marginTop: 2 }}>
                            Exceeds stock!
                          </div>
                        )}
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
            * Note: Submitting this sales voucher will automatically decrease the inventory stock quantity for all listed items.
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
                disabled={submitting || customers.length === 0 || itemsList.length === 0}
                style={{ width: "100%", padding: "10px 16px", fontSize: 14 }}
              >
                Post Sales Voucher
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
