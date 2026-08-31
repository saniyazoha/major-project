import { Search, Bell, CircleHelp, LogOut } from "lucide-react";

import { useNavigate } from "react-router-dom";

function Header({ role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    navigate("/login", { replace: true });
  };

  return (
    <header
      className="app-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      {/* =========================
          SEARCH
      ========================= */}

      <div
        style={{
          width: "100%",
          maxWidth: 560,
          position: "relative",
        }}
      >
        <Search
          size={19}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#667085",
            pointerEvents: "none",
          }}
        />

        <input
          type="text"
          placeholder="Search lectures, transcripts..."
          aria-label="Search lectures and transcripts"
          style={{
            width: "100%",
            height: 42,
            padding: "0 16px 0 44px",
            border: "1px solid #dfe4ec",
            borderRadius: 999,
            background: "#f7f9fc",
            color: "#102a4c",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {/* =========================
          HEADER ACTIONS
      ========================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Notification */}

        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          style={{
            width: 36,
            height: 36,
            border: "none",
            background: "transparent",
            color: "#102a4c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <Bell size={19} />
        </button>

        {/* Help */}

        <button
          type="button"
          aria-label="Help"
          title="Help"
          style={{
            width: 36,
            height: 36,
            border: "none",
            background: "transparent",
            color: "#102a4c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <CircleHelp size={19} />
        </button>

        {/* Profile */}

        <div
          title={role === "faculty" ? "Faculty" : "Student"}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#173b6d",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {role === "faculty" ? "SP" : "ST"}
        </div>

        {/* Logout */}

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          style={{
            height: 38,
            padding: "0 14px",
            border: "1px solid #dfe4ec",
            borderRadius: 8,
            background: "#ffffff",
            color: "#102a4c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut size={17} />

          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
