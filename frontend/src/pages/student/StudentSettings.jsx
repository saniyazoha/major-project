import { useEffect, useState } from "react";
import { Bell, Lock, Mail, Save, User } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import { apiClient } from "../../api/client";

export default function StudentSettings() {
  const { user, updateUser } = useAuthContext();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileStatus, setProfileStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/auth/student/me")
      .then((data) => {
        if (isMounted && data) {
          setName(data.name || "");
          setEmail(data.email || "");
        }
      })
      .catch(() => {
        // preserve fallback from auth context if fetch fails
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileStatus(null);

    if (!name.trim()) {
      setProfileStatus({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setIsSavingProfile(true);

    try {
      const updated = await apiClient.patch("/auth/student/me", {
        name: name.trim(),
        email: email.trim() || null,
      });

      setName(updated.name || "");
      setEmail(updated.email || "");
      if (updateUser) {
        updateUser({ name: updated.name, email: updated.email });
      }
      setProfileStatus({
        type: "success",
        text: "Profile settings saved successfully.",
      });
    } catch (err) {
      setProfileStatus({
        type: "error",
        text: err?.message || "Failed to update profile settings.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({
        type: "error",
        text: "Please fill in all password fields.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiClient.post("/auth/student/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordStatus({
        type: "success",
        text: "Password changed successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({
        type: "error",
        text: err?.message || "Failed to change password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="student-page">
      {/* Header */}
      <section className="page-header">
        <p className="eyebrow">ACCOUNT</p>

        <h1>Student Settings</h1>

        <p className="muted">
          Manage your student profile, password, and notification preferences.
        </p>
      </section>

      {/* Profile Settings */}
      <section className="card student-settings-card">
        <div className="student-settings-section-header">
          <div className="student-settings-icon">
            <User size={22} />
          </div>

          <div>
            <h2>Profile Information</h2>

            <p className="muted">Update your student account information.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="student-settings-form">
            {profileStatus && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  fontSize: "14px",
                  background:
                    profileStatus.type === "error"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(34, 197, 94, 0.1)",
                  color: profileStatus.type === "error" ? "#dc2626" : "#16a34a",
                  border: `1px solid ${
                    profileStatus.type === "error"
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(34, 197, 94, 0.2)"
                  }`,
                }}
              >
                {profileStatus.text}
              </div>
            )}

            {/* Name */}
            <div className="upload-form-field">
              <label htmlFor="student-name">Full Name</label>

              <div className="student-settings-input-wrapper">
                <User size={18} />

                <input
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="upload-form-field">
              <label htmlFor="student-email">Email Address</label>

              <div className="student-settings-input-wrapper">
                <Mail size={18} />

                <input
                  id="student-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-action-button"
              disabled={isSavingProfile}
            >
              <Save size={17} />
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* Notification Settings */}
      <section className="card student-settings-card">
        <div className="student-settings-section-header">
          <div className="student-settings-icon">
            <Bell size={22} />
          </div>

          <div>
            <h2>Notifications</h2>

            <p className="muted">Control your learning notifications.</p>
          </div>
        </div>

        <label className="student-notification-option">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(event) => setNotifications(event.target.checked)}
          />

          <div>
            <strong>Learning notifications</strong>

            <p className="muted">
              Notify me about lecture processing, learning updates, and
              important course activity.
            </p>
          </div>
        </label>
      </section>

      {/* Password */}
      <section className="card student-settings-card">
        <div className="student-settings-section-header">
          <div className="student-settings-icon">
            <Lock size={22} />
          </div>

          <div>
            <h2>Change Password</h2>

            <p className="muted">Update your account password.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange}>
          <div className="student-settings-form">
            {passwordStatus && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  fontSize: "14px",
                  background:
                    passwordStatus.type === "error"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(34, 197, 94, 0.1)",
                  color: passwordStatus.type === "error" ? "#dc2626" : "#16a34a",
                  border: `1px solid ${
                    passwordStatus.type === "error"
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(34, 197, 94, 0.2)"
                  }`,
                }}
              >
                {passwordStatus.text}
              </div>
            )}

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
              disabled={isChangingPassword}
            >
              <Lock size={17} />
              {isChangingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
