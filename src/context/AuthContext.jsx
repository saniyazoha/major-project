import { createContext, useContext, useState } from "react";
import { users } from "../data/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("lectAIUser");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (username, password, role) => {
    const foundUser = users.find(
      (item) =>
        item.username === username &&
        item.password === password &&
        item.role === role,
    );

    if (!foundUser) {
      return {
        success: false,
        message: "Invalid username, password, or role.",
      };
    }

    setUser(foundUser);
    localStorage.setItem("lectAIUser", JSON.stringify(foundUser));

    return {
      success: true,
      user: foundUser,
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lectAIUser");
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
