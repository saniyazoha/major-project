import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  BookOpen,
  TrendingUp,
  Settings,
} from "lucide-react";

function Sidebar({ role }) {
  const navigate = useNavigate();

  const isFaculty = role === "faculty";

  const menuItems = isFaculty
    ? [
        {
          label: "Dashboard",
          path: "/faculty/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Upload",
          path: "/faculty/uploads",
          icon: Upload,
        },
        {
          label: "Subjects",
          path: "/faculty/subjects",
          icon: BookOpen,
        },
        {
          label: "Settings",
          path: "/faculty/settings",
          icon: Settings,
        },
      ]
    : [
        {
          label: "Dashboard",
          path: "/student/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Subjects",
          path: "/student/subjects",
          icon: BookOpen,
        },
        {
          label: "Progress",
          path: "/student/progress",
          icon: TrendingUp,
        },
        {
          label: "Settings",
          path: "/student/settings",
          icon: Settings,
        },
      ];

  return (
    <aside className="sidebar">
      {/* =========================
          LOGO
      ========================= */}

      <div className="sidebar-logo">
        <div className="logo-icon">L</div>

        <div>
          <h2>LectaAI</h2>

          <span>ACADEMIC PORTAL</span>
        </div>
      </div>

      {/* =========================
          FACULTY UPLOAD BUTTON
      ========================= */}

      {isFaculty && (
        <div
          style={{
            padding: "7px 10px 5px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/faculty/uploads/new")}
            style={{
              width: "100%",
              minHeight: 38,
              border: "none",
              borderRadius: 8,
              background: "#2f76d2",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "7px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(23, 59, 109, 0.14)",
            }}
          >
            <Upload size={16} />

            <span>Upload Lecture</span>
          </button>
        </div>
      )}

      {/* =========================
          NAVIGATION
      ========================= */}

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
