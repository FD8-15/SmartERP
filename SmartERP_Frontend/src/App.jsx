import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

// Import CSS stylesheets
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/forms.css";
import "./styles/tables.css";
import "./styles/vouchers.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <AppRoutes />
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
