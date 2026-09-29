import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllItems, createItem, updateItem } from "../../services/itemService.js";
import { getCategories } from "../../services/categoryService.js";
import { getUnits } from "../../services/unitService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function ItemList() {
  const { currentCompanyId } = useCompany();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [form, setForm] = useState({
    item_name: "",
    sku: "",
    brand: "",
    category_id: "",
    unit_id: "",
    gst_percentage: "18",
    default_purchase_price: "",
    default_selling_price: "",
    current_quantity: "0",
    status: "active",
  });

  const loadData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const [itemsData, catsData, unitsData] = await Promise.all([
        getAllItems(currentCompanyId),
        getCategories(currentCompanyId),
        getUnits(currentCompanyId),
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setUnits(unitsData);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load inventory items"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      item_name: "",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      brand: "",
      category_id: categories[0]?.category_id ? String(categories[0].category_id) : "",
      unit_id: units[0]?.unit_id ? String(units[0].unit_id) : "",
      gst_percentage: "18",
      default_purchase_price: "",
      default_selling_price: "",
      current_quantity: "0",
      status: "active",
    });
    setModalError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setForm({
      item_name: item.item_name || "",
      sku: item.sku || "",
      brand: item.brand || "",
      category_id: String(item.category_id || ""),
      unit_id: String(item.unit_id || ""),
      gst_percentage: String(item.gst_percentage || "0"),
      default_purchase_price: String(item.default_purchase_price || "0"),
      default_selling_price: String(item.default_selling_price || "0"),
      current_quantity: String(item.current_quantity || "0"),
      status: item.status || "active",
    });
    setModalError("");
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.category_id || !form.unit_id) {
      setModalError("Please select both a Category and a Measurement Unit");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      if (editingItem) {
        // Stock changes are NOT allowed via normal item update (per ERP rules)
        await updateItem(currentCompanyId, editingItem.item_id, {
          item_name: form.item_name.trim(),
          sku: form.sku.trim(),
          brand: form.brand.trim(),
          category_id: Number(form.category_id),
          unit_id: Number(form.unit_id),
          gst_percentage: Number(form.gst_percentage),
          default_purchase_price: Number(form.default_purchase_price),
          default_selling_price: Number(form.default_selling_price),
          status: form.status,
        });
      } else {
        await createItem(currentCompanyId, {
          item_name: form.item_name.trim(),
          sku: form.sku.trim(),
          brand: form.brand.trim(),
          category_id: Number(form.category_id),
          unit_id: Number(form.unit_id),
          gst_percentage: Number(form.gst_percentage),
          default_purchase_price: Number(form.default_purchase_price),
          default_selling_price: Number(form.default_selling_price),
          current_quantity: Number(form.current_quantity),
          status: form.status,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(extractErrorMessage(err, "Failed to save item"));
    } finally {
      setModalLoading(false);
    }
  }

  // Create lookup maps for category & unit names
  const categoryMap = Object.fromEntries(categories.map((c) => [c.category_id, c.category_name]));
  const unitMap = Object.fromEntries(units.map((u) => [u.unit_id, u.unit_name]));

  const columns = [
    {
      header: "SKU",
      key: "sku",
      style: { width: 110 },
      render: (row) => <span className="mono" style={{ fontWeight: 600 }}>{row.sku}</span>,
    },
    {
      header: "Item Name",
      key: "item_name",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.item_name}</div>
          {row.brand && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Brand: {row.brand}</div>}
        </div>
      ),
    },
    {
      header: "Category",
      key: "category_id",
      render: (row) => (
        <span className="badge badge-neutral">
          {categoryMap[row.category_id] || `#${row.category_id}`}
        </span>
      ),
    },
    {
      header: "Unit",
      key: "unit_id",
      render: (row) => (
        <span className="badge badge-neutral mono">
          {unitMap[row.unit_id] || `#${row.unit_id}`}
        </span>
      ),
    },
    {
      header: "Purchase Price",
      key: "default_purchase_price",
      align: "right",
      render: (row) => <span className="mono">{formatCurrency(row.default_purchase_price)}</span>,
    },
    {
      header: "Selling Price",
      key: "default_selling_price",
      align: "right",
      render: (row) => <span className="mono">{formatCurrency(row.default_selling_price)}</span>,
    },
    {
      header: "GST",
      key: "gst_percentage",
      align: "center",
      render: (row) => <span className="mono">{row.gst_percentage}%</span>,
    },
    {
      header: "Stock Quantity",
      key: "current_quantity",
      align: "center",
      render: (row) => {
        const qty = Number(row.current_quantity);
        return (
          <span
            className={`badge ${qty > 10 ? "badge-success" : qty > 0 ? "badge-warning" : "badge-danger"} mono`}
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            {qty} {unitMap[row.unit_id] || ""}
          </span>
        );
      },
    },
    {
      header: "Status",
      key: "status",
      align: "center",
      render: (row) => (
        <span className={`badge ${row.status === "active" ? "badge-primary" : "badge-neutral"}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenEdit(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Items & Stock Inventory</h1>
          <div className="page-subtitle">Product catalog, default pricing, tax rates, and live stock levels</div>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Item
          </Button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {categories.length === 0 || units.length === 0 ? (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <span>
            <strong>Prerequisite needed:</strong> You need at least one Category and one Unit to register items.
            {categories.length === 0 && (
              <span> <Link to="/categories">Create a Category</Link></span>
            )}
            {categories.length === 0 && units.length === 0 && <span> and </span>}
            {units.length === 0 && (
              <span> <Link to="/units">Create a Unit</Link></span>
            )}
          </span>
        </div>
      ) : null}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No items found. Click '+ Add Item' to register your inventory items."
        keyField="item_id"
      />

      {/* Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.item_name}` : "New Inventory Item"}
        size="lg"
      >
        <ErrorMessage message={modalError} onDismiss={() => setModalError("")} />

        <form onSubmit={handleSave}>
          <div className="form-grid">
            <Input
              label="Item Name"
              name="item_name"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="e.g. Dell Latitude 5420 Laptop"
              required
              autoFocus
            />

            <Input
              label="SKU / Barcode"
              name="sku"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="e.g. SKU-DELL-5420"
              helperText="Unique SKU identifier"
              required
            />

            <Input
              label="Brand / Manufacturer"
              name="brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="e.g. Dell, HP, Tata"
              required
            />

            <div className="form-group">
              <label>
                <span>Category</span>
                <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <span>Measurement Unit</span>
                <span className="required">*</span>
              </label>
              <select
                className="form-control"
                value={form.unit_id}
                onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                required
              >
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u.unit_id} value={u.unit_id}>
                    {u.unit_name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="GST Tax Rate (%)"
              name="gst_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.gst_percentage}
              onChange={(e) => setForm({ ...form, gst_percentage: e.target.value })}
              required
            />

            <Input
              label="Default Purchase Price (₹)"
              name="default_purchase_price"
              type="number"
              min="0"
              step="0.01"
              value={form.default_purchase_price}
              onChange={(e) => setForm({ ...form, default_purchase_price: e.target.value })}
              placeholder="0.00"
              required
            />

            <Input
              label="Default Selling Price (₹)"
              name="default_selling_price"
              type="number"
              min="0"
              step="0.01"
              value={form.default_selling_price}
              onChange={(e) => setForm({ ...form, default_selling_price: e.target.value })}
              placeholder="0.00"
              required
            />

            {editingItem ? (
              <div className="form-group">
                <label>Current Stock (Quantity)</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.current_quantity}
                  disabled
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Stock changes are recorded through Purchase & Sales Vouchers.
                </span>
              </div>
            ) : (
              <Input
                label="Opening Stock Quantity"
                name="current_quantity"
                type="number"
                min="0"
                value={form.current_quantity}
                onChange={(e) => setForm({ ...form, current_quantity: e.target.value })}
                required
              />
            )}

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: "20px -20px -20px", padding: "14px 20px" }}>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={modalLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={modalLoading}
            >
              {editingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
