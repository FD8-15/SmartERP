import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getAllCompanies, getCompanyDetails } from "../services/companyService.js";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [currentCompanyId, setCurrentCompanyId] = useState(() => {
    return localStorage.getItem("smarterp_selected_company_id") || null;
  });
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchCompanies = useCallback(async () => {
    if (!isAuthenticated) {
      setCompanies([]);
      setCurrentCompanyId(null);
      setCompanyDetails(null);
      return;
    }
    setLoadingCompanies(true);
    try {
      const list = await getAllCompanies();
      setCompanies(list);
      
      // Auto-select company if only one or if previously selected
      const savedId = localStorage.getItem("smarterp_selected_company_id");
      const matched = list.find((c) => String(c.company_id) === String(savedId));
      
      if (matched) {
        setCurrentCompanyId(String(matched.company_id));
      } else if (list.length > 0) {
        setCurrentCompanyId(String(list[0].company_id));
        localStorage.setItem("smarterp_selected_company_id", String(list[0].company_id));
      } else {
        setCurrentCompanyId(null);
        localStorage.removeItem("smarterp_selected_company_id");
      }
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // When currentCompanyId changes, load its details
  useEffect(() => {
    if (!currentCompanyId) {
      setCompanyDetails(null);
      return;
    }

    async function loadDetails() {
      try {
        const details = await getCompanyDetails(currentCompanyId);
        setCompanyDetails(details);
      } catch {
        setCompanyDetails(null);
      }
    }

    loadDetails();
  }, [currentCompanyId]);

  function selectCompany(companyId) {
    const idStr = String(companyId);
    setCurrentCompanyId(idStr);
    localStorage.setItem("smarterp_selected_company_id", idStr);
  }

  const value = {
    companies,
    currentCompanyId,
    companyDetails,
    loadingCompanies,
    selectCompany,
    refreshCompanies: fetchCompanies,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
