import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Key,
  Copy,
  Check
} from "lucide-react";
import {
  deriveKeyFromPassword,
  wrapMasterKey,
  unwrapMasterKey,
  exportMasterKeyRaw,
  importMasterKeyRaw,
  decryptText,
  generateRecoveryKey,
  encryptText
} from "../utils/crypto";
import API from "../config";
import "../App.css";

function ProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const token = localStorage.getItem("token");
  const currentEmail = localStorage.getItem("email") || "";

  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Recovery Key Reveal with Password Re-prompt State
  const [showPromptForKey, setShowPromptForKey] = useState(false);
  const [repromptPassword, setRepromptPassword] = useState("");
  const [repromptLoading, setRepromptLoading] = useState(false);
  const [repromptError, setRepromptError] = useState("");
  const [revealedRecoveryKey, setRevealedRecoveryKey] = useState("");
  const [copiedRevealedKey, setCopiedRevealedKey] = useState(false);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(localStorage.getItem("email") || "");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
      setShowDeleteConfirm(false);
      setShowPromptForKey(false);
      setRepromptPassword("");
      setRepromptError("");
      setRevealedRecoveryKey("");
      setCopiedRevealedKey(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email address is required.");
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      let encryptedMasterKeyPassword = undefined;

      // If user is updating password, re-wrap master key with new password key
      const rawMasterKeyHex = sessionStorage.getItem("masterKey") || localStorage.getItem("masterKey");
      if (password && rawMasterKeyHex) {
        const masterKey = await importMasterKeyRaw(rawMasterKeyHex);
        const userSalt = localStorage.getItem("userSalt") || "taskflow-default-salt";
        const newPassKey = await deriveKeyFromPassword(password, userSalt);
        encryptedMasterKeyPassword = await wrapMasterKey(masterKey, newPassKey);
      }

      const res = await axios.put(
        `${API}/api/auth/profile`,
        {
          email,
          ...(password ? { password } : {}),
          ...(encryptedMasterKeyPassword ? { encryptedMasterKeyPassword } : {})
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email", res.data.email);
      setSuccess("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
      if (onProfileUpdated) onProfileUpdated(res.data.email);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 404) {
        setError("Endpoint not deployed yet (404). Please push & deploy backend changes to Render.");
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Unable to connect to backend server. Please check your connection.");
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevealRecoveryKey = async (e) => {
    e.preventDefault();
    setRepromptError("");
    setRepromptLoading(true);

    try {
      // 1. Re-verify user credentials
      const res = await axios.post(`${API}/api/auth/login`, {
        email: localStorage.getItem("email"),
        password: repromptPassword
      });

      // 2. Unwrap master key from login response
      if (!res.data.userSalt || !res.data.encryptedMasterKeyPassword) {
        setRepromptError("Zero-Knowledge Encryption is not enabled for this account.");
        setRepromptLoading(false);
        return;
      }

      const passKey = await deriveKeyFromPassword(repromptPassword, res.data.userSalt);
      const masterKey = await unwrapMasterKey(res.data.encryptedMasterKeyPassword, passKey);

      // Save active master key in session storage & local storage
      const rawMasterKey = await exportMasterKeyRaw(masterKey);
      sessionStorage.setItem("masterKey", rawMasterKey);
      localStorage.setItem("masterKey", rawMasterKey);

      // 3. Decrypt stored encryptedRecoveryKey or generate on the fly for existing accounts
      let plainRecKey = "";

      if (res.data.encryptedRecoveryKey) {
        plainRecKey = await decryptText(res.data.encryptedRecoveryKey, masterKey);
      } else {
        // Fallback for existing accounts: Generate and store Recovery Key now!
        const newRecKeyStr = generateRecoveryKey();
        const userSalt = res.data.userSalt || localStorage.getItem("userSalt") || "taskflow-default-salt";
        const recKey = await deriveKeyFromPassword(newRecKeyStr, userSalt);
        const encryptedMasterKeyRecovery = await wrapMasterKey(masterKey, recKey);
        const encryptedRecoveryKey = await encryptText(newRecKeyStr, masterKey);

        await axios.put(
          `${API}/api/auth/profile`,
          {
            encryptedMasterKeyRecovery,
            encryptedRecoveryKey
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        localStorage.setItem("encryptedRecoveryKey", encryptedRecoveryKey);
        plainRecKey = newRecKeyStr;
      }

      setRevealedRecoveryKey(plainRecKey);
      setRepromptPassword("");
      setShowPromptForKey(false);
    } catch (err) {
      if (err.response?.data?.message) {
        setRepromptError(err.response.data.message);
      } else {
        setRepromptError("Invalid password. Verification failed.");
      }
    } finally {
      setRepromptLoading(false);
    }
  };

  const handleCopyRevealedKey = () => {
    if (revealedRecoveryKey) {
      navigator.clipboard.writeText(revealedRecoveryKey);
      setCopiedRevealedKey(true);
      setTimeout(() => setCopiedRevealedKey(false), 2500);
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    setDeleteLoading(true);

    try {
      await axios.delete(`${API}/api/auth/account`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      localStorage.clear();
      sessionStorage.clear();
      onClose();
      window.location.href = "/";
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 404) {
        setError("Endpoint not deployed yet (404). Please push & deploy backend changes to Render.");
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Unable to connect to backend server. Please try again.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
      setDeleteLoading(false);
    }
  };

  const modalJSX = (
    <div className="apple-modal-overlay apple-fade" onClick={onClose}>
      <div className="apple-modal-sheet pop-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-apple">
          <div className="apple-logo-badge">
            <div className="apple-icon-circle">
              <User size={18} />
            </div>
            <span>Account Settings</span>
          </div>

          <button className="btn-apple-action" onClick={onClose} title="Close">
            <X size={18} />
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

        <form onSubmit={handleUpdateProfile}>
          <div className="apple-field-group">
            <label className="apple-label">Email Address</label>
            <div className="apple-input-wrapper">
              <input
                type="email"
                className="apple-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="apple-input-icon" size={18} />
            </div>
          </div>

          <div className="apple-field-group" style={{ marginTop: 14 }}>
            <label className="apple-label">New Password (leave blank to keep current)</label>
            <div className="apple-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="apple-input"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {password.length > 0 && (
            <div className="apple-field-group" style={{ marginTop: 14 }}>
              <label className="apple-label">Confirm New Password</label>
              <div className="apple-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="apple-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock className="apple-input-icon" size={18} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-apple-primary"
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            <Save size={16} />
            <span>{loading ? "Saving..." : "Save Changes"}</span>
          </button>
        </form>

        {/* Zero-Knowledge Recovery Key Section */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              <Key size={18} color="var(--apple-blue)" />
              <span>Recovery Key</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--apple-green)", fontWeight: 600, background: "rgba(52, 199, 89, 0.12)", padding: "2px 8px", borderRadius: 12 }}>
              Zero-Knowledge
            </span>
          </div>

          {!revealedRecoveryKey && !showPromptForKey && (
            <button
              type="button"
              className="btn-nav-outline"
              style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 8, padding: 10 }}
              onClick={() => setShowPromptForKey(true)}
            >
              <Lock size={15} />
              <span>Reveal Recovery Key</span>
            </button>
          )}

          {showPromptForKey && !revealedRecoveryKey && (
            <form onSubmit={handleRevealRecoveryKey} className="apple-fade" style={{ background: "var(--bg-input)", padding: 14, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
              <label className="apple-label" style={{ fontSize: 12, marginBottom: 6 }}>
                Re-enter Password to Reveal Key
              </label>
              <div className="apple-input-wrapper" style={{ marginBottom: 10 }}>
                <input
                  type="password"
                  className="apple-input"
                  placeholder="Enter current password"
                  value={repromptPassword}
                  onChange={(e) => setRepromptPassword(e.target.value)}
                  required
                />
                <Lock className="apple-input-icon" size={16} />
              </div>
              {repromptError && (
                <div style={{ fontSize: 12, color: "var(--apple-red)", marginBottom: 8 }}>
                  {repromptError}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn-apple-primary" style={{ flex: 1, padding: 8, fontSize: 13 }} disabled={repromptLoading}>
                  {repromptLoading ? "Verifying..." : "Verify & Reveal"}
                </button>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  style={{ flex: 1, padding: 8, fontSize: 13 }}
                  onClick={() => {
                    setShowPromptForKey(false);
                    setRepromptPassword("");
                    setRepromptError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {revealedRecoveryKey && (
            <div className="apple-fade" style={{ background: "rgba(0, 122, 255, 0.08)", padding: 14, borderRadius: 12, border: "1px solid rgba(0, 122, 255, 0.2)" }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.4 }}>
                Your 24-character Zero-Knowledge Recovery Key:
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontFamily: "monospace", fontSize: 13, fontWeight: 700, background: "var(--bg-card-solid)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", letterSpacing: 1 }}>
                  {revealedRecoveryKey}
                </code>
                <button
                  type="button"
                  className="btn-nav-outline"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px" }}
                  onClick={handleCopyRevealedKey}
                >
                  {copiedRevealedKey ? <Check size={14} color="var(--apple-green)" /> : <Copy size={14} />}
                  <span>{copiedRevealedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <button
                type="button"
                style={{ marginTop: 10, background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "center" }}
                onClick={() => {
                  setRevealedRecoveryKey("");
                  setShowPromptForKey(false);
                }}
              >
                Hide Key
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone: Delete Account */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--border-subtle)"
          }}
        >
          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn-apple-logout"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              <span>Delete Account</span>
            </button>
          ) : (
            <div
              className="apple-alert apple-alert-error apple-fade"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 700 }}>Permanently Delete Account?</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.4 }}>
                This will delete your account and remove all associated tasks from the database. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 4 }}>
                <button
                  type="button"
                  className="btn-apple-logout"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default ProfileModal;
