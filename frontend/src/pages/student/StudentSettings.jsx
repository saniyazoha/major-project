import { useState } from "react";
import { Bell, Lock, Mail, Save, User } from "lucide-react";

export default function StudentSettings() {
  const [name, setName] = useState("Student");
  const [email, setEmail] = useState("student@example.com");
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

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }

    alert("Password changed successfully.");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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

            <button type="submit" className="primary-action-button">
              <Save size={17} />
              Save Profile
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

            <button type="submit" className="primary-action-button">
              <Lock size={17} />
              Change Password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
