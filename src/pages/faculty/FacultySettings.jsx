import { useState } from "react";
import { Save, User, Mail, Lock, Bell } from "lucide-react";

export default function FacultySettings() {
  const [name, setName] = useState("Faculty Member");
  const [email, setEmail] = useState("faculty@example.com");
  const [notifications, setNotifications] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProfileSave = (event) => {
    event.preventDefault();

    alert("Profile settings saved successfully.");
  };

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

  return (
    <div className="page">
      {/* Header */}
      <section className="page-heading">
        <p className="eyebrow">ACCOUNT</p>

        <h1>Faculty Settings</h1>

        <p className="muted">
          Manage your faculty profile, password, and notification preferences.
        </p>
      </section>

      {/* Profile Settings */}
      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <User size={24} />

          <div>
            <h2 style={{ margin: 0 }}>Profile Information</h2>

            <p className="muted" style={{ margin: "4px 0 0" }}>
              Update your faculty account information.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            {/* Name */}
            <div className="upload-form-field">
              <label htmlFor="faculty-name">Full Name</label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />

                <input
                  id="faculty-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  style={{
                    paddingLeft: 40,
                    width: "100%",
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
                }}
              >
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />

                <input
                  id="faculty-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  style={{
                    paddingLeft: 40,
                    width: "100%",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-action-button"
              style={{
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Save size={17} />
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Notification Settings */}
      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Bell size={24} />

          <div>
            <h2 style={{ margin: 0 }}>Notifications</h2>

            <p className="muted" style={{ margin: "4px 0 0" }}>
              Control how you receive lecture processing notifications.
            </p>
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={notifications}
            onChange={(event) => setNotifications(event.target.checked)}
          />

          <div>
            <strong>Lecture processing notifications</strong>

            <p className="muted" style={{ margin: "4px 0 0" }}>
              Notify me when uploaded lectures finish processing.
            </p>
          </div>
        </label>
      </section>

      {/* Password */}
      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Lock size={24} />

          <div>
            <h2 style={{ margin: 0 }}>Change Password</h2>

            <p className="muted" style={{ margin: "4px 0 0" }}>
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
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Lock size={17} />
              Change Password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
