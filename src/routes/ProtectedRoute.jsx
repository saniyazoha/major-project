import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const location = useLocation();

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  const storedRole = localStorage.getItem("role");

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!isAuthenticated || !storedRole) {
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
