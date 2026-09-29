import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCompany } from "../../context/CompanyContext.jsx";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  Tags, 
  Ruler, 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  Wallet,
  Plus
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const { companies, currentCompanyId, selectCompany } = useCompany();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">SE</div>
        <div>
          <div className="sidebar-title">SmartERP</div>
          <div style={{ fontSize: 11, color: "var(--text-sidebar)" }}>Cloud ERP Suite</div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="sidebar-company-switcher">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
            Select Company
          </span>
          <Link
            to="/company/new"
            style={{ fontSize: 11, color: "#38bdf8", display: "flex", alignItems: "center", gap: 2 }}
            title="Create New Company"
          >
            <Plus size={12} /> New
          </Link>
        </div>

        {companies.length > 0 ? (
          <select
            className="company-select-box"
            value={currentCompanyId || ""}
            onChange={(e) => selectCompany(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.company_name}
              </option>
            ))}
          </select>
        ) : (
          <Link
            to="/company/new"
            className="btn btn-primary btn-sm"
            style={{ width: "100%", fontSize: 12 }}
          >
            + Create Company
          </Link>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <LayoutDashboard className="nav-icon" size={18} />
          <span>Dashboard</span>
        </NavLink>

        <div className="nav-section-title">Masters</div>
        <NavLink
          to="/company"
          end
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Building2 className="nav-icon" size={18} />
          <span>Company Profile</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Users className="nav-icon" size={18} />
          <span>Customers</span>
        </NavLink>

        <NavLink
          to="/suppliers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Truck className="nav-icon" size={18} />
          <span>Suppliers</span>
        </NavLink>

        <NavLink
          to="/items"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Package className="nav-icon" size={18} />
          <span>Items & Inventory</span>
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Tags className="nav-icon" size={18} />
          <span>Categories</span>
        </NavLink>

        <NavLink
          to="/units"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Ruler className="nav-icon" size={18} />
          <span>Units</span>
        </NavLink>

        <div className="nav-section-title">Purchases</div>
        <NavLink
          to="/purchase-vouchers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <ShoppingCart className="nav-icon" size={18} />
          <span>Purchase Vouchers</span>
        </NavLink>

        <NavLink
          to="/payment-vouchers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <CreditCard className="nav-icon" size={18} />
          <span>Payment Vouchers</span>
        </NavLink>

        <div className="nav-section-title">Sales</div>
        <NavLink
          to="/sales-vouchers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Receipt className="nav-icon" size={18} />
          <span>Sales Vouchers</span>
        </NavLink>

        <NavLink
          to="/receipt-vouchers"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Wallet className="nav-icon" size={18} />
          <span>Receipt Vouchers</span>
        </NavLink>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-name">{user?.name || "User"}</div>
          <div className="user-role-badge">Online</div>
        </div>
      </div>
    </aside>
  );
}
