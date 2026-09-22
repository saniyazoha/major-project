import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { TOKEN_KEY } from "../api/client";

function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthContext();

  const token = localStorage.getItem(TOKEN_KEY);
  const storedRole = user?.role || localStorage.getItem("role");

  useEffect(() => {
    const handlePageShow = (event) => {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (!currentToken) {
        window.location.replace("/login");
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePageShow);
    };
  }, []);

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!token || !isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ==========================================
  // WRONG ROLE
  // ==========================================

  if (role && storedRole !== role) {
    if (storedRole === "faculty") {
      return <Navigate to="/faculty/dashboard" replace />;
    }

    if (storedRole === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }

    // Unknown role
    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // AUTHENTICATED + CORRECT ROLE
  // ==========================================

  return children;
}

export default ProtectedRoute;
