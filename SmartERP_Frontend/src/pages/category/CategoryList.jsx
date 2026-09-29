import { useState, useEffect, useCallback } from "react";
import { useCompany } from "../../context/CompanyContext.jsx";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../services/categoryService.js";
import Table from "../../components/common/Table.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function CategoryList() {
  const { currentCompanyId } = useCompany();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadCategories = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getCategories(currentCompanyId);
      setCategories(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function handleOpenCreate() {
    setEditingCategory(null);
    setCategoryName("");
    setModalError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat) {
    setEditingCategory(cat);
    setCategoryName(cat.category_name || "");
    setModalError("");
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!categoryName.trim()) {
      setModalError("Category name is required");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      if (editingCategory) {
        await updateCategory(currentCompanyId, editingCategory.category_id, {
          category_name: categoryName.trim(),
        });
      } else {
        await createCategory(currentCompanyId, {
          category_name: categoryName.trim(),
        });
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      setModalError(extractErrorMessage(err, "Failed to save category"));
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Are you sure you want to delete category "${cat.category_name}"?`)) {
      return;
    }
    try {
      await deleteCategory(currentCompanyId, cat.category_id);
      await loadCategories();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to delete category"));
    }
  }

  const columns = [
    {
      header: "Category ID",
      key: "category_id",
      style: { width: 120 },
      render: (row) => <span className="mono">#{row.category_id}</span>,
    },
    {
      header: "Category Name",
      key: "category_name",
      render: (row) => <span style={{ fontWeight: 600 }}>{row.category_name}</span>,
    },
    {
      header: "Actions",
      align: "right",
      render: (row) => (
        <div style={{ display: "inline-flex", gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Item Categories</h1>
          <div className="page-subtitle">Organize inventory items into logical product categories</div>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Category
          </Button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      <Table
        columns={columns}
        data={categories}
        loading={loading}
        emptyMessage="No categories found. Click '+ Add Category' to create your first category."
        keyField="category_id"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "New Category"}
      >
        <ErrorMessage message={modalError} onDismiss={() => setModalError("")} />

        <form onSubmit={handleSave}>
          <Input
            label="Category Name"
            name="category_name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. Raw Materials, Electronics, Apparel"
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
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
