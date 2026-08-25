import { useEffect, useState } from "react";

import {
  Bell,
  CheckCircle2,
  Lock,
  Mail,
  Moon,
  Save,
  Sun,
  User,
} from "lucide-react";

const THEME_STORAGE_KEY = "lectai-theme";

export default function FacultySettings() {
  /* =====================================================
     PROFILE STATE
  ===================================================== */

  const [name, setName] = useState("Faculty Member");

  const [email, setEmail] = useState("faculty@example.com");

  /* =====================================================
     NOTIFICATION STATE
  ===================================================== */

  const [notifications, setNotifications] = useState(true);

  /* =====================================================
     PASSWORD STATE
  ===================================================== */

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  /* =====================================================
     THEME STATE

     Light mode is the default.

     If a saved theme already exists in localStorage,
     use it instead.
  ===================================================== */

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    return "light";
  });

  /* =====================================================
     APPLY THEME
  ===================================================== */

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  /* =====================================================
     PROFILE SAVE
  ===================================================== */

  const handleProfileSave = (event) => {
    event.preventDefault();

    alert("Profile settings saved successfully.");
  };

  /* =====================================================
     PASSWORD CHANGE
  ===================================================== */

  const handlePasswordChange = (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    alert("Password changed successfully.");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  /* =====================================================
     THEME TOGGLE
  ===================================================== */

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const isDarkMode = theme === "dark";

  return (
    <div className="page faculty-settings-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="page-heading">
        <p className="eyebrow">ACCOUNT</p>

        <h1>Faculty Settings</h1>

        <p className="muted">
          Manage your faculty profile, notifications, appearance, and account
          security.
        </p>
      </section>

      {/* =================================================
          SETTINGS GRID
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 20,
          marginTop: 22,
          alignItems: "start",
        }}
        className="faculty-settings-grid"
      >
        {/* =================================================
            PROFILE INFORMATION
        ================================================= */}

        <section
          className="card faculty-settings-card"
          style={{
            padding: 24,
          }}
        >
          <div
            className="faculty-settings-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              className="faculty-settings-icon"
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: 10,
                background: "var(--settings-icon-bg, #eef5fb)",
                color: "var(--settings-icon-color, #173b6d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={21} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                }}
              >
                Profile Information
              </h2>

              <p
                className="muted"
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                }}
              >
                Update your faculty account information.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div
              style={{
                display: "grid",
                gap: 17,
              }}
            >
              {/* Full Name */}

              <div className="upload-form-field">
                <label htmlFor="faculty-name">Full Name</label>

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <User
                    size={17}
                    style={{
                      position: "absolute",
                      left: 13,
                      pointerEvents: "none",
                    }}
                  />

                  <input
                    id="faculty-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    style={{
                      paddingLeft: 41,
                    }}
                  />
                </div>
              </div>

              {/* Email */}

              <div className="upload-form-field">
                <label htmlFor="faculty-email">Email Address</label>

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Mail
                    size={17}
                    style={{
                      position: "absolute",
                      left: 13,
                      pointerEvents: "none",
                    }}
                  />

                  <input
                    id="faculty-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    style={{
                      paddingLeft: 41,
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="primary-action-button"
                style={{
                  width: "fit-content",
                }}
              >
                <Save size={16} />
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* =================================================
            APPEARANCE
        ================================================= */}

        <section
          className="card faculty-settings-card"
          style={{
            padding: 24,
          }}
        >
          <div
            className="faculty-settings-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              className="faculty-settings-icon"
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: 10,
                background: "var(--settings-icon-bg, #eef5fb)",
                color: "var(--settings-icon-color, #173b6d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDarkMode ? <Moon size={21} /> : <Sun size={21} />}
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                }}
              >
                Appearance
              </h2>

              <p
                className="muted"
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                }}
              >
                Choose how LectAI appears on your device.
              </p>
            </div>
          </div>

          {/* Theme row */}

          <div
            className="faculty-theme-setting"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              padding: 16,
              border: "1px solid var(--border-color, #e5eaf0)",
              borderRadius: 11,
              background: "var(--surface-muted, #fafbfd)",
            }}
          >
            {/* Left */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9,
                  background: "var(--settings-icon-bg, #eef5fb)",
                  color: "var(--settings-icon-color, #173b6d)",
                }}
              >
                {isDarkMode ? <Moon size={19} /> : <Sun size={19} />}
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Theme
                </strong>

                <p
                  className="muted"
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                  }}
                >
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </p>
              </div>
            </div>

            {/* Toggle */}

            <button
              type="button"
              onClick={handleThemeToggle}
              role="switch"
              aria-checked={isDarkMode}
              aria-label="Toggle dark mode"
              className={`faculty-theme-toggle ${isDarkMode ? "active" : ""}`}
              style={{
                width: 54,
                height: 30,
                flexShrink: 0,
                position: "relative",
                border: "none",
                borderRadius: 999,
                padding: 0,
                background: isDarkMode ? "#173b6d" : "#d8dee8",
                transition: "background 0.22s ease",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: isDarkMode ? 28 : 4,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
                  transition: "left 0.22s ease",
                }}
              />
            </button>
          </div>

          {/* Current status */}

          <div
            style={{
              marginTop: 14,
              padding: "11px 13px",
              borderRadius: 9,
              background: "var(--surface-muted, #f7f9fc)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
            }}
          >
            <CheckCircle2 size={16} />

            <span className="muted">
              Current theme:{" "}
              <strong
                style={{
                  color: "inherit",
                }}
              >
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </strong>
            </span>
          </div>
        </section>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <section
          className="card faculty-settings-card"
          style={{
            padding: 24,
          }}
        >
          <div
            className="faculty-settings-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              className="faculty-settings-icon"
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: 10,
                background: "var(--settings-icon-bg, #eef5fb)",
                color: "var(--settings-icon-color, #173b6d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={21} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                }}
              >
                Notifications
              </h2>

              <p
                className="muted"
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                }}
              >
                Control your lecture-processing notifications.
              </p>
            </div>
          </div>

          <label
            className="faculty-notification-option"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              cursor: "pointer",
              padding: 15,
              border: "1px solid var(--border-color, #e5eaf0)",
              borderRadius: 10,
              background: "var(--surface-muted, #fafbfd)",
            }}
          >
            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) => setNotifications(event.target.checked)}
              style={{
                marginTop: 2,
              }}
            />

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: 14,
                }}
              >
                Lecture processing notifications
              </strong>

              <p
                className="muted"
                style={{
                  margin: "5px 0 0",
                  fontSize: 12,
                  lineHeight: 1.55,
                }}
              >
                Notify me when uploaded lectures finish processing.
              </p>
            </div>
          </label>
        </section>

        {/* =================================================
            CHANGE PASSWORD
        ================================================= */}

        <section
          className="card faculty-settings-card"
          style={{
            padding: 24,
          }}
        >
          <div
            className="faculty-settings-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              className="faculty-settings-icon"
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: 10,
                background: "var(--settings-icon-bg, #eef5fb)",
                color: "var(--settings-icon-color, #173b6d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock size={21} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                }}
              >
                Change Password
              </h2>

              <p
                className="muted"
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                }}
              >
                Update your account password.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange}>
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              {/* Current Password */}

              <div className="upload-form-field">
                <label htmlFor="current-password">Current Password</label>

                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}

              <div className="upload-form-field">
                <label htmlFor="new-password">New Password</label>

                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              {/* Confirm Password */}

              <div className="upload-form-field">
                <label htmlFor="confirm-password">Confirm New Password</label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                className="primary-action-button"
                style={{
                  width: "fit-content",
                }}
              >
                <Lock size={16} />
                Change Password
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* =================================================
          RESPONSIVE SUPPORT SPECIFIC TO THIS PAGE
      ================================================= */}

      <style>
        {`
          @media (max-width: 900px) {
            .faculty-settings-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 600px) {
            .faculty-settings-card {
              padding: 18px !important;
            }

            .faculty-theme-setting {
              align-items: flex-start !important;
            }

            .faculty-settings-card .primary-action-button {
              width: 100% !important;
            }
          }
        `}
      </style>
    </div>
  );
}
