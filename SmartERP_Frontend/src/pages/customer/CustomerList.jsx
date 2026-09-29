import { useState, useEffect, useCallback } from "react";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getAllCustomers, createCustomer, updateCustomer } from "../../services/customerService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function CustomerList() {
  const { currentCompanyId } = useCompany();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({ name: "", contact_no: "" });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadCustomers = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAllCustomers(currentCompanyId);
      setCustomers(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load customers"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  function handleOpenCreate() {
    setEditingCustomer(null);
    setForm({ name: "", contact_no: "" });
    setModalError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(cust) {
    setEditingCustomer(cust);
    setForm({ name: cust.name || "", contact_no: cust.contact_no || "" });
    setModalError("");
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact_no.trim()) {
      setModalError("Both Name and Contact Number are required");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      if (editingCustomer) {
        await updateCustomer(currentCompanyId, editingCustomer.customer_id, {
          name: form.name.trim(),
          contact_no: form.contact_no.trim(),
        });
      } else {
        await createCustomer(currentCompanyId, {
          name: form.name.trim(),
          contact_no: form.contact_no.trim(),
        });
      }
      setIsModalOpen(false);
      await loadCustomers();
    } catch (err) {
      setModalError(extractErrorMessage(err, "Failed to save customer"));
    } finally {
      setModalLoading(false);
    }
  }

  const columns = [
    {
      header: "ID",
      key: "customer_id",
      style: { width: 80 },
      render: (row) => <span className="mono">#{row.customer_id}</span>,
    },
    {
      header: "Customer Name",
      key: "name",
      render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
    },
    {
      header: "Contact Number",
      key: "contact_no",
      render: (row) => <span className="mono">{row.contact_no}</span>,
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
          <h1 className="page-title">Customers</h1>
          <div className="page-subtitle">Manage customer master directory and contact details</div>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Customer
          </Button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customers found. Click '+ Add Customer' to register one."
        keyField="customer_id"
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
      >
        <ErrorMessage message={modalError} onDismiss={() => setModalError("")} />

        <form onSubmit={handleSave}>
          <Input
            label="Customer Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Reliance Retail"
            required
            autoFocus
          />

          <Input
            label="Contact Number"
            name="contact_no"
            value={form.contact_no}
            onChange={(e) => setForm({ ...form, contact_no: e.target.value })}
            placeholder="e.g. 9876543210"
            helperText="Must be unique per company"
            required
          />

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
              {editingCustomer ? "Update Customer" : "Create Customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
