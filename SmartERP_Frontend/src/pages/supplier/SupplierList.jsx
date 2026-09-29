import { useState, useEffect, useCallback } from "react";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllSuppliers, createSupplier, updateSupplier } from "../../services/supplierService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function SupplierList() {
  const { currentCompanyId } = useCompany();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({
    name: "",
    contact_no: "",
    email: "",
    address: "",
    gst_no: "",
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadSuppliers = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAllSuppliers(currentCompanyId);
      setSuppliers(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load suppliers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  function handleOpenCreate() {
    setEditingSupplier(null);
    setForm({ name: "", contact_no: "", email: "", address: "", gst_no: "" });
    setModalError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(sup) {
    setEditingSupplier(sup);
    setForm({
      name: sup.name || "",
      contact_no: sup.contact_no || "",
      email: sup.email || "",
      address: sup.address || "",
      gst_no: sup.gst_no || "",
    });
    setModalError("");
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.contact_no.trim() ||
      !form.email.trim() ||
      !form.address.trim() ||
      !form.gst_no.trim()
    ) {
      setModalError("All fields (Name, Contact, Email, Address, GSTIN) are required");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      const payload = {
        name: form.name.trim(),
        contact_no: form.contact_no.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        gst_no: form.gst_no.trim(),
      };

      if (editingSupplier) {
        await updateSupplier(currentCompanyId, editingSupplier.supplier_id, payload);
      } else {
        await createSupplier(currentCompanyId, payload);
      }
      setIsModalOpen(false);
      await loadSuppliers();
    } catch (err) {
      setModalError(extractErrorMessage(err, "Failed to save supplier"));
    } finally {
      setModalLoading(false);
    }
  }

  const columns = [
    {
      header: "ID",
      key: "supplier_id",
      style: { width: 70 },
      render: (row) => <span className="mono">#{row.supplier_id}</span>,
    },
    {
      header: "Supplier Name",
      key: "name",
      render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
    },
    {
      header: "GSTIN",
      key: "gst_no",
      render: (row) => <span className="mono" style={{ color: "var(--primary)" }}>{row.gst_no}</span>,
    },
    {
      header: "Contact No",
      key: "contact_no",
      render: (row) => <span className="mono">{row.contact_no}</span>,
    },
    {
      header: "Email",
      key: "email",
    },
    {
      header: "Address",
      key: "address",
      render: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {row.address?.length > 40 ? `${row.address.substring(0, 40)}...` : row.address}
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
          <h1 className="page-title">Suppliers / Vendors</h1>
          <div className="page-subtitle">Manage procurement vendors, GSTINs, and contact information</div>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Supplier
          </Button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={suppliers}
        loading={loading}
        emptyMessage="No suppliers found. Click '+ Add Supplier' to register one."
        keyField="supplier_id"
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "New Supplier"}
        size="lg"
      >
        <ErrorMessage message={modalError} onDismiss={() => setModalError("")} />

        <form onSubmit={handleSave}>
          <div className="form-grid">
            <Input
              label="Supplier / Vendor Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tata Steel Trading"
              required
              autoFocus
            />

            <Input
              label="GSTIN Number"
              name="gst_no"
              value={form.gst_no}
              onChange={(e) => setForm({ ...form, gst_no: e.target.value })}
              placeholder="e.g. 27ABCDE1234F1Z5"
              helperText="Must be unique per company"
              required
            />

            <Input
              label="Contact Phone"
              name="contact_no"
              value={form.contact_no}
              onChange={(e) => setForm({ ...form, contact_no: e.target.value })}
              placeholder="e.g. 9876543210"
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vendor@company.com"
              required
            />

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <textarea
                className="form-control"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Vendor office/factory address"
                required
              />
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
              {editingSupplier ? "Update Supplier" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
