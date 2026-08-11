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
  CheckCircle2,
  Key,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import API from "../config";
import {
  generateSalt,
  deriveKeyFromPassword,
  generateMasterKey,
  generateRecoveryKey,
  wrapMasterKey,
  unwrapMasterKey,
  exportMasterKeyRaw,
  encryptText
} from "../utils/crypto";
import "../App.css";

function AuthModal({ isOpen, onClose, initialTab = "login", onSuccess }) {
  const [authTab, setAuthTab] = useState(initialTab); // 'login' | 'register' | 'recover'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Account creation generated recovery key state
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    setAuthTab(initialTab);
    setGeneratedRecoveryKey("");
    setCopiedKey(false);
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

  const handleCopyKey = () => {
    if (generatedRecoveryKey) {
      navigator.clipboard.writeText(generatedRecoveryKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || (authTab !== "recover" && !password)) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (authTab === "login") {
        const res = await axios.post(`${API}/api/auth/login`, {
          email,
          password
        });

        // Store JWT token & Email
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("email", res.data.email);
        if (res.data.userSalt) localStorage.setItem("userSalt", res.data.userSalt);
        if (res.data.encryptedRecoveryKey) localStorage.setItem("encryptedRecoveryKey", res.data.encryptedRecoveryKey);

        // Zero-Knowledge Key Unwrap
        if (res.data.userSalt && res.data.encryptedMasterKeyPassword) {
          try {
            const passKey = await deriveKeyFromPassword(password, res.data.userSalt);
            const masterKey = await unwrapMasterKey(
              res.data.encryptedMasterKeyPassword,
              passKey
            );
            const rawMasterKey = await exportMasterKeyRaw(masterKey);
            sessionStorage.setItem("masterKey", rawMasterKey);
            localStorage.setItem("masterKey", rawMasterKey);
          } catch (cryptoErr) {
            console.error("Zero-Knowledge Key Unwrap failed:", cryptoErr);
          }
        }

        if (onSuccess) onSuccess();
        onClose();
        window.location.href = "/todo";

      } else if (authTab === "register") {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        // Generate Zero-Knowledge Key Wrapping Setup
        const userSalt = generateSalt();
        const masterKey = await generateMasterKey();
        const recKeyString = generateRecoveryKey();

        const passKey = await deriveKeyFromPassword(password, userSalt);
        const recKey = await deriveKeyFromPassword(recKeyString, userSalt);

        const encryptedMasterKeyPassword = await wrapMasterKey(masterKey, passKey);
        const encryptedMasterKeyRecovery = await wrapMasterKey(masterKey, recKey);
        const encryptedRecoveryKey = await encryptText(recKeyString, masterKey);

        await axios.post(`${API}/api/auth/register`, {
          email,
          password,
          userSalt,
          encryptedMasterKeyPassword,
          encryptedMasterKeyRecovery,
          encryptedRecoveryKey
        });

        // Store active master key in session & local storage so user can immediately add encrypted tasks
        const rawMasterKey = await exportMasterKeyRaw(masterKey);
        sessionStorage.setItem("masterKey", rawMasterKey);
        localStorage.setItem("masterKey", rawMasterKey);
        localStorage.setItem("userSalt", userSalt);

        setGeneratedRecoveryKey(recKeyString);
        setSuccess("Account created successfully! Save your Zero-Knowledge Recovery Key below.");
        setPassword("");
        setConfirmPassword("");

      } else if (authTab === "recover") {
        if (!recoveryInput || !password) {
          setError("Recovery Key and New Password are required.");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("New Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        // Fetch User Cryptography Fields via dedicated endpoint
        const keyParamsRes = await axios.post(`${API}/api/auth/user-key-params`, {
          email
        });

        const userSalt = keyParamsRes.data?.userSalt;
        const encryptedMasterKeyRecovery = keyParamsRes.data?.encryptedMasterKeyRecovery;

        if (!encryptedMasterKeyRecovery || !userSalt) {
          setError("Zero-Knowledge Recovery Key is not set up for this user account.");
          setLoading(false);
          return;
        }

        // Unwrap Master Key using Recovery Key
        const cleanRecKey = recoveryInput.trim().toUpperCase();
        const recKey = await deriveKeyFromPassword(cleanRecKey, userSalt);

        let masterKey;
        try {
          masterKey = await unwrapMasterKey(encryptedMasterKeyRecovery, recKey);
        } catch {
          setError("Invalid Recovery Key. Please check the 24-character code and try again.");
          setLoading(false);
          return;
        }

        // Re-wrap Master Key with New Password
        const newPassKey = await deriveKeyFromPassword(password, userSalt);
        const newEncryptedMasterKeyPassword = await wrapMasterKey(masterKey, newPassKey);

        const recoverRes = await axios.post(`${API}/api/auth/recover-account`, {
          email,
          newPassword: password,
          newEncryptedMasterKeyPassword
        });

        localStorage.setItem("token", recoverRes.data.token);
        localStorage.setItem("email", recoverRes.data.email);

        const rawMasterKey = await exportMasterKeyRaw(masterKey);
        sessionStorage.setItem("masterKey", rawMasterKey);
        localStorage.setItem("masterKey", rawMasterKey);

        setSuccess("Account recovered successfully! Redirecting...");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          window.location.href = "/todo";
        }, 1200);
      }
    } catch (err) {
      console.error("AuthModal submission error:", err);

      const serverMsg = err.response?.data?.message || err.response?.data?.error;

      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 404) {
        setError("User account not found or backend endpoint not deployed.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to backend server. Please check your connection.");
      } else if (err.message) {
        setError(err.message);
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
            <span>TaskFlow E2EE</span>
          </div>

          <button className="btn-apple-action" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Auth Tabs Header (Sign In & Create Account) */}
        <div className="auth-tabs-header" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`auth-tab-btn ${authTab === "login" || authTab === "recover" ? "active" : ""}`}
            onClick={() => {
              setAuthTab("login");
              setError("");
              setSuccess("");
              setGeneratedRecoveryKey("");
            }}
          >
            {authTab === "recover" ? "Account Recovery" : "Sign In"}
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authTab === "register" ? "active" : ""}`}
            onClick={() => {
              setAuthTab("register");
              setError("");
              setSuccess("");
              setGeneratedRecoveryKey("");
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

        {/* Recovery Key Banner upon Registration */}
        {generatedRecoveryKey && (
          <div
            className="apple-alert apple-fade"
            style={{
              background: "rgba(52, 199, 89, 0.12)",
              border: "1px solid rgba(52, 199, 89, 0.3)",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
              padding: 16,
              marginBottom: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--apple-green)", fontWeight: 700 }}>
              <ShieldCheck size={18} />
              <span>Your Zero-Knowledge Recovery Key</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
              Save this key in a secure location. If you ever forget your master password, this is the <strong>only way</strong> to recover your encrypted reminders.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <code
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "var(--bg-input)",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-subtle)",
                  letterSpacing: 1,
                  color: "var(--text-primary)"
                }}
              >
                {generatedRecoveryKey}
              </code>
              <button
                type="button"
                className="btn-nav-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px" }}
                onClick={handleCopyKey}
              >
                {copiedKey ? <Check size={15} color="var(--apple-green)" /> : <Copy size={15} />}
                <span>{copiedKey ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <button
              type="button"
              className="btn-apple-primary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => {
                setGeneratedRecoveryKey("");
                setAuthTab("login");
                setSuccess("Please sign in with your new account details.");
              }}
            >
              I Have Saved My Key — Proceed to Sign In
            </button>
          </div>
        )}

        {!generatedRecoveryKey && (
          <form onSubmit={handleSubmit}>
            <div className="apple-field-group">
              <label className="apple-label">Email Address</label>
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

            {authTab === "recover" && (
              <div className="apple-field-group">
                <label className="apple-label">24-Character Recovery Key</label>
                <div className="apple-input-wrapper">
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="A4B8-9F22-C110-E7D3-488B-62FA"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    required
                  />
                  <Key className="apple-input-icon" size={18} />
                </div>
              </div>
            )}

            <div className="apple-field-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="apple-label" style={{ marginBottom: 0 }}>
                  {authTab === "recover" ? "New Password" : "Password"}
                </label>
                {authTab === "login" && (
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--apple-blue)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0
                    }}
                    onClick={() => {
                      setAuthTab("recover");
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="apple-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="apple-input"
                  placeholder={authTab === "recover" ? "Set New Password" : "Password"}
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
                : authTab === "register"
                ? "Create Account"
                : "Recover Account & Reset Password"}
              {!loading && <ArrowRight size={18} />}
            </button>

            {authTab === "recover" && (
              <button
                type="button"
                style={{
                  width: "100%",
                  marginTop: 12,
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onClick={() => {
                  setAuthTab("login");
                  setError("");
                  setSuccess("");
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to Sign In</span>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default AuthModal;
