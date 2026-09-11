import { createContext, useState, useEffect, useContext } from "react";
import { getAuthToken, getAuthUser, setAuthToken, setAuthUser, clearAuthStorage } from "../utils/authStorage";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = getAuthToken();
    const storedUser = getAuthUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    
    // Store in localStorage
    setAuthToken(data.token);
    const loggedInUser = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    };
    setAuthUser(loggedInUser);

    // Update state
    setToken(data.token);
    setUser(loggedInUser);
    setIsAuthenticated(true);

    return loggedInUser;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
