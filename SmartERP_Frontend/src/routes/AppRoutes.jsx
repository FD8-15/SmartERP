import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";
import Loading from "../components/common/Loading.jsx";

// Auth Pages
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

// Dashboard
import Dashboard from "../pages/dashboard/Dashboard.jsx";

// Company
import CompanyDetails from "../pages/company/CompanyDetails.jsx";
import CreateCompany from "../pages/company/CreateCompany.jsx";

// Masters
import CustomerList from "../pages/customer/CustomerList.jsx";
import SupplierList from "../pages/supplier/SupplierList.jsx";
import ItemList from "../pages/item/ItemList.jsx";
import CategoryList from "../pages/category/CategoryList.jsx";
import UnitList from "../pages/unit/UnitList.jsx";

// Vouchers
import PurchaseVoucherList from "../pages/voucher/PurchaseVoucherList.jsx";
import PurchaseVoucherCreate from "../pages/voucher/PurchaseVoucherCreate.jsx";
import PaymentVoucherList from "../pages/voucher/PaymentVoucherList.jsx";
import PaymentVoucherCreate from "../pages/voucher/PaymentVoucherCreate.jsx";
import SalesVoucherList from "../pages/voucher/SalesVoucherList.jsx";
import SalesVoucherCreate from "../pages/voucher/SalesVoucherCreate.jsx";
import ReceiptVoucherList from "../pages/voucher/ReceiptVoucherList.jsx";
import ReceiptVoucherCreate from "../pages/voucher/ReceiptVoucherCreate.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Authenticating session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Protected App Routes inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Company */}
        <Route path="company" element={<CompanyDetails />} />
        <Route path="company/new" element={<CreateCompany />} />

        {/* Master Data */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="items" element={<ItemList />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="units" element={<UnitList />} />

        {/* Purchase Cycle */}
        <Route path="purchase-vouchers" element={<PurchaseVoucherList />} />
        <Route path="purchase-vouchers/new" element={<PurchaseVoucherCreate />} />
        <Route path="payment-vouchers" element={<PaymentVoucherList />} />
        <Route path="payment-vouchers/new" element={<PaymentVoucherCreate />} />

        {/* Sales Cycle */}
        <Route path="sales-vouchers" element={<SalesVoucherList />} />
        <Route path="sales-vouchers/new" element={<SalesVoucherCreate />} />
        <Route path="receipt-vouchers" element={<ReceiptVoucherList />} />
        <Route path="receipt-vouchers/new" element={<ReceiptVoucherCreate />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
