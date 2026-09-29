import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { createCompany } from "../../services/companyService.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { extractErrorMessage } from "../../utils/errorHandler.js";

export default function CreateCompany() {
  const navigate = useNavigate();
  const { refreshCompanies, selectCompany } = useCompany();

  const [form, setForm] = useState({
    company_name: "",
    email: "",
    address: "",
    contact_number: "",
    state: "",
    gst_no: "",
    financial_year_start: "2026-04-01",
    financial_year_end: "2027-03-31",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const created = await createCompany({
        company_name: form.company_name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        contact_number: form.contact_number.trim(),
        state: form.state.trim(),
        gst_no: form.gst_no.trim(),
        financial_year_start: form.financial_year_start,
        financial_year_end: form.financial_year_end,
      });

      await refreshCompanies();
      if (created?.company_id) {
        selectCompany(created.company_id);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to create company"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Company</h1>
          <div className="page-subtitle">Configure company details, taxation, and financial year</div>
        </div>
      </div>

      <div className="card">
        <ErrorMessage message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="Company Name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="e.g. Acme Enterprises Pvt Ltd"
              required
              autoFocus
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="billing@company.com"
              required
            />

            <Input
              label="Contact Number"
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              placeholder="9876543210"
              required
            />

            <Input
              label="State / Province"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="e.g. Maharashtra, Goa, Delhi"
              required
            />

            <Input
              label="GSTIN Number"
              name="gst_no"
              value={form.gst_no}
              onChange={handleChange}
              placeholder="22AAAAA0000A1Z5"
              required
            />

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>
                <span>Registered Address</span>
                <span className="required">*</span>
              </label>
              <textarea
                name="address"
                className="form-control"
                value={form.address}
                onChange={handleChange}
                placeholder="Complete street address..."
                required
              />
            </div>

            <Input
              label="Financial Year Start"
              name="financial_year_start"
              type="date"
              value={form.financial_year_start}
              onChange={handleChange}
              required
            />

            <Input
              label="Financial Year End"
              name="financial_year_end"
              type="date"
              value={form.financial_year_end}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Save Company
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
