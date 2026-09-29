import { useState, useEffect, useCallback } from "react";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getUnits, createUnit, updateUnit } from "../../services/unitService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function UnitList() {
  const { currentCompanyId } = useCompany();

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitName, setUnitName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadUnits = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getUnits(currentCompanyId);
      setUnits(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load units"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  function handleOpenCreate() {
    setEditingUnit(null);
    setUnitName("");
    setModalError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(u) {
    setEditingUnit(u);
    setUnitName(u.unit_name || "");
    setModalError("");
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!unitName.trim()) {
      setModalError("Unit name is required");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      if (editingUnit) {
        await updateUnit(currentCompanyId, editingUnit.unit_id, {
          unit_name: unitName.trim(),
        });
      } else {
        await createUnit(currentCompanyId, {
          unit_name: unitName.trim(),
        });
      }
      setIsModalOpen(false);
      await loadUnits();
    } catch (err) {
      setModalError(extractErrorMessage(err, "Failed to save unit"));
    } finally {
      setModalLoading(false);
    }
  }

  const columns = [
    {
      header: "Unit ID",
      key: "unit_id",
      style: { width: 120 },
      render: (row) => <span className="mono">#{row.unit_id}</span>,
    },
    {
      header: "Unit Measurement Name",
      key: "unit_name",
      render: (row) => <span style={{ fontWeight: 600 }}>{row.unit_name}</span>,
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
          <h1 className="page-title">Measurement Units</h1>
          <div className="page-subtitle">Configure units of measure (e.g. PCS, KGS, BOX, LTR)</div>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Unit
          </Button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={units}
        loading={loading}
        emptyMessage="No measurement units found. Click '+ Add Unit' to register one."
        keyField="unit_id"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? "Edit Unit" : "New Measurement Unit"}
      >
        <ErrorMessage message={modalError} onDismiss={() => setModalError("")} />

        <form onSubmit={handleSave}>
          <Input
            label="Unit Name"
            name="unit_name"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="e.g. PCS, NOS, KGS, BOX, MTR"
            required
            autoFocus
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
              {editingUnit ? "Update Unit" : "Create Unit"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
