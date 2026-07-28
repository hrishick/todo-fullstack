import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  CheckSquare,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import API from "../config";
import "../App.css";

function AuthModal({ isOpen, onClose, initialTab = "login", onSuccess }) {
  const [authTab, setAuthTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setAuthTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (authTab === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (authTab === "login") {
        const res = await axios.post(`${API}/api/auth/login`, {
          email,
          password
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("email", res.data.email);
        if (onSuccess) onSuccess();
        onClose();
        window.location.href = "/todo";
      } else {
        await axios.post(`${API}/api/auth/register`, {
          email,
          password
        });
        setSuccess("Account created successfully! Please sign in now.");
        setAuthTab("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Unable to connect to backend server. Please check your connection.");
      } else {
        setError("Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const modalJSX = (
    <div className="apple-modal-overlay apple-fade" onClick={onClose}>
      <div className="apple-modal-sheet pop-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-apple">
          <div className="apple-logo-badge">
            <div className="apple-icon-circle">
              <CheckSquare size={18} />
            </div>
            <span>TaskFlow</span>
          </div>

          <button className="btn-apple-action" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Auth Tabs */}
        <div className="auth-tabs-header" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`auth-tab-btn ${authTab === "login" ? "active" : ""}`}
            onClick={() => {
              setAuthTab("login");
              setError("");
              setSuccess("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authTab === "register" ? "active" : ""}`}
            onClick={() => {
              setAuthTab("register");
              setError("");
              setSuccess("");
            }}
          >
            Create Account
          </button>
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

        <form onSubmit={handleSubmit}>
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

          {authTab === "register" && (
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
          )}

          <button type="submit" className="btn-apple-primary" disabled={loading} style={{ marginTop: 14 }}>
            {loading
              ? "Processing..."
              : authTab === "login"
              ? "Sign In"
              : "Create Account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default AuthModal;
