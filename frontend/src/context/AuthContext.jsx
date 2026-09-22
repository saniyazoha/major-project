import { createContext, useContext, useState } from "react";
import { apiClient, TOKEN_KEY, clearAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem("lectAIUser");
      if (token && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      // ignore storage / JSON parsing error
    }
    return null;
  });

  const login = async (username, password, role) => {
    const endpoint =
      role === "faculty" ? "/auth/faculty/login" : "/auth/student/login";

    const payload =
      role === "faculty"
        ? { username, password }
        : { roll_no: username, password };

    try {
      const response = await apiClient.post(endpoint, payload);

      if (!response || !response.access_token) {
        return {
          success: false,
          message: "Invalid response received from authentication server.",
        };
      }

      const userData = {
        id: response.user_id,
        username: response.username,
        name: response.name,
        role: response.role,
      };

      // Persist real JWT token and user metadata
      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem("lectAIUser", JSON.stringify(userData));
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("role", response.role);
      localStorage.setItem("username", response.username);

      setUser(userData);

      return {
        success: true,
        user: userData,
        data: response,
      };
    } catch (error) {
      const message =
        error?.message || "Invalid username, password, or role.";
      return {
        success: false,
        message,
      };
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthToken();
    try {
      localStorage.removeItem("lectAIUser");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
    } catch (e) {
      // ignore storage removal errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
