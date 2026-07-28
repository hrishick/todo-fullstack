import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useTheme } from "../context/useTheme";
import API from "../config";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const register = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/api/auth/register`, {
        email,
        password
      });

      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
          <h2>Create Your TaskFlow ID</h2>
          <p>One account to sync all your tasks across devices</p>
        </div>

        {error && (
          <div className="apple-alert apple-alert-error apple-fade">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="apple-alert apple-alert-success apple-fade">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={register}>
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
                placeholder="At least 6 characters"
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

          <div className="apple-field-group">
            <label className="apple-label">Confirm Password</label>
            <div className="apple-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="apple-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Lock className="apple-input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn-apple-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Continue"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer-apple">
          <span>Already have an account?</span>
          <Link to="/login" className="apple-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;