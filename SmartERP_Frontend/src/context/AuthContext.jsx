import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, logoutUser } from "../services/authService.js";
import { getAllCompanies } from "../services/companyService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("smarterp_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Check auth session validity on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Calling getAllCompanies tests whether the accessToken cookie is valid
        await getAllCompanies();
      } catch (err) {
        if (err.status === 401 || err.message?.includes("Please Login")) {
          setUser(null);
          localStorage.removeItem("smarterp_user");
          localStorage.removeItem("smarterp_selected_company_id");
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(credentials) {
    const loggedInUser = await loginUser(credentials);
    setUser(loggedInUser);
    localStorage.setItem("smarterp_user", JSON.stringify(loggedInUser));
    return loggedInUser;
  }

  async function register(userData) {
    const newUser = await registerUser(userData);
    return newUser;
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem("smarterp_user");
      localStorage.removeItem("smarterp_selected_company_id");
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
