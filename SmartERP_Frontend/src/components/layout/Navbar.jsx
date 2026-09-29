import { useAuth } from "../../context/AuthContext.jsx";
import { useCompany } from "../../context/CompanyContext.jsx";
import Button from "../common/Button.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { companyDetails } = useCompany();

  return (
    <header className="top-navbar">
      <div className="current-company-display">
        {companyDetails ? (
          <>
            <span className="badge badge-primary">Active</span>
            <span className="company-badge-name">{companyDetails.company_name}</span>
            <span className="badge badge-neutral mono" style={{ fontSize: 11 }}>
              GST: {companyDetails.gst_no}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
              FY: {companyDetails.financial_year_start} to {companyDetails.financial_year_end}
            </span>
          </>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No company selected
          </span>
        )}
      </div>

      <div className="top-navbar-actions">
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name || "User"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.email}</div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          title="Sign out of SmartERP"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}
