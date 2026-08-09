import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  BookOpen,
  TrendingUp,
  Settings,
} from "lucide-react";

function Sidebar({ role }) {
  const isFaculty = role === "faculty";

  const menuItems = isFaculty
    ? [
        {
          label: "Dashboard",
          path: "/faculty/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Uploads",
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
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <div>
          <h2>Lec-AI</h2>
          <span>{isFaculty ? "Faculty Portal" : "Student Portal"}</span>
        </div>
      </div>

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
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;