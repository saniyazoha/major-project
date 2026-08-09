import { useState } from "react";
import { GraduationCap, UserRound, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();

    setError("");

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError(
        role === "student"
          ? "Please enter your USN."
          : "Please enter your username.",
      );
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);

    /*
     * Demo authentication
     *
     * Replace this section later with your backend/API authentication.
     */

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("role", role);
    localStorage.setItem("username", trimmedUsername);

    // Small delay so the button shows the login state.
    setTimeout(() => {
      setIsLoggingIn(false);

      /*
       * If the user originally tried to access a protected page,
       * send them back there when possible.
       */
      const from = location.state?.from?.pathname;

      if (from && from !== "/login") {
        navigate(from, { replace: true });
        return;
      }

      if (role === "faculty") {
        navigate("/faculty/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* =========================================
            HEADER
        ========================================== */}

        <div className="login-header">
          <div className="login-logo">
            <GraduationCap size={30} />
          </div>

          <h1>Welcome Back</h1>

          <p>Sign in to continue to your learning analytics dashboard.</p>
        </div>

        {/* =========================================
            ROLE SELECTOR
        ========================================== */}

        <div className="role-selector">
          <button
            type="button"
            className={`role-button ${role === "student" ? "active" : ""}`}
            onClick={() => {
              setRole("student");
              setError("");
            }}
          >
            <GraduationCap size={18} />

            <span>Student</span>
          </button>

          <button
            type="button"
            className={`role-button ${role === "faculty" ? "active" : ""}`}
            onClick={() => {
              setRole("faculty");
              setError("");
            }}
          >
            <UserRound size={18} />

            <span>Faculty</span>
          </button>
        </div>

        {/* =========================================
            LOGIN FORM
        ========================================== */}

        <form onSubmit={handleLogin} className="login-form">
          {/* Error */}

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          {/* Username / USN */}

          <div className="login-field">
            <label htmlFor="login-username">
              {role === "student" ? "USN" : "Username"}
            </label>

            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              placeholder={
                role === "student" ? "Enter your USN" : "Enter your username"
              }
              autoComplete="username"
            />
          </div>

          {/* Password */}

          <div className="login-field">
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {/* Login */}

          <button
            type="submit"
            className="login-submit-button"
            disabled={isLoggingIn}
          >
            <LogIn size={18} />

            {isLoggingIn ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
