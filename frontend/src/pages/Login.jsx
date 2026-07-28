import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  CheckSquare,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle
} from "lucide-react";
import { useTheme } from "../context/useTheme";
import API from "../config";
import "../App.css";

function Login() {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email", res.data.email);

      window.location.href = "/todo";
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Email or Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper apple-fade">
      <div className="auth-card-apple">
        {/* Top Header & Theme Switcher */}
        <div className="auth-top-bar">
          <Link to="/" className="apple-logo-badge" style={{ textDecoration: 'none' }}>
            <div className="apple-icon-circle">
              <CheckSquare size={20} />
            </div>
            <span>TaskFlow</span>
          </Link>

          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="auth-header-apple">
          <h2>Sign in with TaskFlow</h2>
          <p>Access your tasks, reminders, and synced lists</p>
        </div>

        {error && (
          <div className="apple-alert apple-alert-error apple-fade">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={login}>
          <div className="apple-field-group">
            <label className="apple-label">Email</label>
            <div className="apple-input-wrapper">
              <input
                type="email"
                className="apple-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="apple-input-icon" size={18} />
            </div>
          </div>

          <div className="apple-field-group">
            <label className="apple-label">Password</label>
            <div className="apple-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="apple-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="apple-input-icon" size={18} />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-apple-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer-apple">
          <span>Don't have a TaskFlow ID?</span>
          <Link to="/register" className="apple-link">
            Create yours now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;