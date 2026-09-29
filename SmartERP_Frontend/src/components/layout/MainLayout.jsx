import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import { useCompany } from "../../context/CompanyContext.jsx";

export default function MainLayout() {
  const { currentCompanyId, companies, loadingCompanies } = useCompany();
  const location = useLocation();

  const isCreatingCompany = location.pathname === "/company/new";

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="page-content-wrapper">
          {!loadingCompanies && companies.length === 0 && !isCreatingCompany ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Welcome to SmartERP!</h2>
              <p style={{ color: "var(--text-muted)", maxWidth: 450, margin: "0 auto 20px" }}>
                To get started with accounting, inventory, and vouchers, please create your first company.
              </p>
              <Link to="/company/new" className="btn btn-primary">
                + Create Your First Company
              </Link>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
