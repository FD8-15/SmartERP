import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAllCustomers } from "../../services/customerService.js";
import { getAllSuppliers } from "../../services/supplierService.js";
import { getAllItems } from "../../services/itemService.js";
import { getAllPurchaseVouchers } from "../../services/purchaseVoucherService.js";
import { getAllSalesVouchers } from "../../services/salesVoucherService.js";
import Loading from "../../components/common/Loading.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import { 
  Users, 
  Truck, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Building2,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { companyDetails, currentCompanyId } = useCompany();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [counts, setCounts] = useState({
    customers: 0,
    suppliers: 0,
    items: 0,
    purchaseVouchers: 0,
    salesVouchers: 0,
  });

  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const loadDashboardData = useCallback(async () => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [customers, suppliers, items, purchases, sales] = await Promise.all([
        getAllCustomers(currentCompanyId),
        getAllSuppliers(currentCompanyId),
        getAllItems(currentCompanyId),
        getAllPurchaseVouchers(currentCompanyId),
        getAllSalesVouchers(currentCompanyId),
      ]);

      setCounts({
        customers: customers.length,
        suppliers: suppliers.length,
        items: items.length,
        purchaseVouchers: purchases.length,
        salesVouchers: sales.length,
      });

      // Recent 5 vouchers
      setRecentPurchases(purchases.slice(-5).reverse());
      setRecentSales(sales.slice(-5).reverse());

      // Low stock warning (stock <= 5)
      const lowStock = items.filter((i) => Number(i.current_quantity) <= 5);
      setLowStockItems(lowStock);
    } catch {
      setError("Failed to load some dashboard summaries");
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <Loading message="Loading company dashboard..." />;
  }

  if (!companyDetails && !currentCompanyId) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <h2>Welcome, {user?.name || "User"}!</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
          Please select or create a company to view the ERP dashboard.
        </p>
        <Link to="/company/new" className="btn btn-primary" style={{ marginTop: 16 }}>
          + Create Company
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>{companyDetails?.company_name || "Company Dashboard"}</span>
          </h1>
          <div className="page-subtitle">
            GSTIN: <span className="mono">{companyDetails?.gst_no || "-"}</span> | State: {companyDetails?.state} | FY: {companyDetails?.financial_year_start?.split("T")[0]} to {companyDetails?.financial_year_end?.split("T")[0]}
          </div>
        </div>

        <div className="header-actions">
          <Link to="/sales-vouchers/new" className="btn btn-primary">
            + Sales Voucher (F8)
          </Link>
          <Link to="/purchase-vouchers/new" className="btn btn-secondary">
            + Purchase Voucher (F9)
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {/* Real Stat Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Customers</div>
            <div className="stat-value">{counts.customers}</div>
            <Link to="/customers" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              Manage Directory <ArrowRight size={12} />
            </Link>
          </div>
          <div className="stat-icon" style={{ background: "#eff6ff", color: "#1e40af" }}>
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Suppliers</div>
            <div className="stat-value">{counts.suppliers}</div>
            <Link to="/suppliers" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              Manage Vendors <ArrowRight size={12} />
            </Link>
          </div>
          <div className="stat-icon" style={{ background: "#f0fdf4", color: "#166534" }}>
            <Truck size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Inventory Items</div>
            <div className="stat-value">{counts.items}</div>
            <Link to="/items" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              View Stock Levels <ArrowRight size={12} />
            </Link>
          </div>
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#92400e" }}>
            <Package size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Purchase Invoices</div>
            <div className="stat-value">{counts.purchaseVouchers}</div>
            <Link to="/purchase-vouchers" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              View Purchases <ArrowRight size={12} />
            </Link>
          </div>
          <div className="stat-icon" style={{ background: "#f3e8ff", color: "#6b21a8" }}>
            <ShoppingCart size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Sales Invoices</div>
            <div className="stat-value">{counts.salesVouchers}</div>
            <Link to="/sales-vouchers" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              View Sales <ArrowRight size={12} />
            </Link>
          </div>
          <div className="stat-icon" style={{ background: "#ecfeff", color: "#0e7490" }}>
            <Receipt size={22} />
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-bg)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--warning)", fontWeight: 700, marginBottom: 8 }}>
            <AlertTriangle size={18} />
            <span>Low Inventory Stock Alert ({lowStockItems.length} items with &le; 5 units)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lowStockItems.slice(0, 8).map((itm) => (
              <span key={itm.item_id} className="badge badge-warning mono" style={{ fontSize: 12 }}>
                {itm.item_name}: {itm.current_quantity} left
              </span>
            ))}
            {lowStockItems.length > 8 && (
              <Link to="/items" style={{ fontSize: 12, alignSelf: "center", marginLeft: 8 }}>
                View all ({lowStockItems.length})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Purchases & Sales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Purchases */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Purchase Vouchers</h3>
            <Link to="/purchase-vouchers" style={{ fontSize: 12 }}>View All</Link>
          </div>

          {recentPurchases.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              No purchase vouchers yet.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((pv) => (
                  <tr key={pv.voucher_id}>
                    <td><span className="mono" style={{ fontWeight: 600 }}>PV-{pv.voucher_id}</span></td>
                    <td><span className="mono">{formatDate(pv.date)}</span></td>
                    <td className="text-right mono" style={{ fontWeight: 600 }}>
                      {formatCurrency(pv.total_amt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Sales Vouchers</h3>
            <Link to="/sales-vouchers" style={{ fontSize: 12 }}>View All</Link>
          </div>

          {recentSales.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              No sales vouchers yet.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sv) => (
                  <tr key={sv.sales_id}>
                    <td><span className="mono" style={{ fontWeight: 600 }}>SV-{sv.sales_id}</span></td>
                    <td><span className="mono">{formatDate(sv.date)}</span></td>
                    <td className="text-right mono" style={{ fontWeight: 600 }}>
                      {formatCurrency(sv.total_amt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
