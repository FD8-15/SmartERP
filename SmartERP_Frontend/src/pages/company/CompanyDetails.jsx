import { useState } from "react";
import { useCompany } from "../../context/CompanyContext.jsx";
import { updateCompany, addCompanyUser } from "../../services/companyService.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Loading from "../../components/common/Loading.jsx";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function CompanyDetails() {
  const { 
    companyDetails, 
    currentCompanyId, 
    companies, 
    selectCompany, 
    refreshCompanies 
  } = useCompany();

  // Edit company modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: "",
    email: "",
    address: "",
    contact_number: "",
    state: "",
    gst_no: "",
    financial_year_start: "",
    financial_year_end: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Add user to company modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("employee"); // 'manager' | 'employee'
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [userModalError, setUserModalError] = useState("");
  const [userSuccessMessage, setUserSuccessMessage] = useState("");

  function openEditModal() {
    if (!companyDetails) return;
    setEditForm({
      company_name: companyDetails.company_name || "",
      email: companyDetails.email || "",
      address: companyDetails.address || "",
      contact_number: companyDetails.contact_number || "",
      state: companyDetails.state || "",
      gst_no: companyDetails.gst_no || "",
      financial_year_start: companyDetails.financial_year_start ? companyDetails.financial_year_start.split("T")[0] : "",
      financial_year_end: companyDetails.financial_year_end ? companyDetails.financial_year_end.split("T")[0] : "",
    });
    setEditError("");
    setIsEditOpen(true);
  }

  async function handleUpdateCompany(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      await updateCompany(currentCompanyId, editForm);
      await refreshCompanies();
      setIsEditOpen(false);
    } catch (err) {
      setEditError(extractErrorMessage(err, "Failed to update company"));
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setUserModalLoading(true);
    setUserModalError("");
    setUserSuccessMessage("");

    try {
      await addCompanyUser(currentCompanyId, { email: userEmail.trim(), role: userRole });
      setUserSuccessMessage(`User ${userEmail} successfully added as ${userRole}`);
      setUserEmail("");
      setTimeout(() => {
        setIsUserModalOpen(false);
        setUserSuccessMessage("");
      }, 1500);
    } catch (err) {
      setUserModalError(extractErrorMessage(err, "Failed to add user to company"));
    } finally {
      setUserModalLoading(false);
    }
  }

  if (!companyDetails && !currentCompanyId) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <h3>No company selected</h3>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Please select or create a company to view profile.</p>
      </div>
    );
  }

  if (!companyDetails) {
    return <Loading message="Loading company details..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{companyDetails.company_name}</h1>
          <div className="page-subtitle">Company identification, financial periods, and authorized users</div>
        </div>

        <div className="header-actions">
          <Button variant="secondary" onClick={() => setIsUserModalOpen(true)}>
            + Add Staff / Manager
          </Button>
          <Button variant="primary" onClick={openEditModal}>
            Edit Company
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Company Details Card */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
            General Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Company ID</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{companyDetails.company_id}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>GSTIN</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 14, color: "var(--primary)" }}>
                {companyDetails.gst_no}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Official Email</div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{companyDetails.email}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Contact Phone</div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{companyDetails.contact_number}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>State</div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{companyDetails.state}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Financial Year</div>
              <div className="mono" style={{ fontWeight: 500, fontSize: 13 }}>
                {companyDetails.financial_year_start?.split("T")[0]} to {companyDetails.financial_year_end?.split("T")[0]}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Registered Office Address</div>
              <div style={{ fontWeight: 500, fontSize: 14, whiteSpace: "pre-line", marginTop: 2 }}>
                {companyDetails.address}
              </div>
            </div>
          </div>
        </div>

        {/* All Companies List Card */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
            Your Companies ({companies.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {companies.map((c) => {
              const isActive = String(c.company_id) === String(currentCompanyId);
              return (
                <div
                  key={c.company_id}
                  onClick={() => selectCompany(c.company_id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                    background: isActive ? "var(--primary-light)" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: isActive ? "var(--primary)" : "var(--text-main)" }}>
                      {c.company_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {c.company_id}</div>
                  </div>
                  {isActive && <span className="badge badge-primary">Active</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Company Profile"
        size="lg"
      >
        <ErrorMessage message={editError} onDismiss={() => setEditError("")} />
        <form onSubmit={handleUpdateCompany}>
          <div className="form-grid">
            <Input
              label="Company Name"
              name="company_name"
              value={editForm.company_name}
              onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
              required
            />
            <Input
              label="Official Email"
              name="email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
            <Input
              label="Contact Number"
              name="contact_number"
              value={editForm.contact_number}
              onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
              required
            />
            <Input
              label="State"
              name="state"
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              required
            />
            <Input
              label="GSTIN Number"
              name="gst_no"
              value={editForm.gst_no}
              onChange={(e) => setEditForm({ ...editForm, gst_no: e.target.value })}
              required
            />
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Registered Address</label>
              <textarea
                className="form-control"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                required
              />
            </div>
            <Input
              label="Financial Year Start"
              name="financial_year_start"
              type="date"
              value={editForm.financial_year_start}
              onChange={(e) => setEditForm({ ...editForm, financial_year_start: e.target.value })}
              required
            />
            <Input
              label="Financial Year End"
              name="financial_year_end"
              type="date"
              value={editForm.financial_year_end}
              onChange={(e) => setEditForm({ ...editForm, financial_year_end: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: "20px -20px -20px", padding: "14px 20px" }}>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={editLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add User to Company Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Add Staff to Company"
      >
        <ErrorMessage message={userModalError} onDismiss={() => setUserModalError("")} />
        {userSuccessMessage && (
          <div className="alert alert-success">{userSuccessMessage}</div>
        )}

        <form onSubmit={handleAddUser}>
          <Input
            label="User Email Address"
            name="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="existing_user@example.com"
            helperText="The user must already be registered in SmartERP."
            required
            autoFocus
          />

          <div className="form-group">
            <label>Assigned Role</label>
            <select
              className="form-control"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="employee">Employee (View masters, create vouchers)</option>
              <option value="manager">Manager (Create/edit masters, vouchers, add users)</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: "20px -20px -20px", padding: "14px 20px" }}>
            <Button variant="secondary" onClick={() => setIsUserModalOpen(false)} disabled={userModalLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={userModalLoading}>
              Grant Access
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
