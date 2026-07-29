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
  AlertTriangle
} from "lucide-react";
import {
  deriveKeyFromPassword,
  wrapMasterKey,
  importMasterKeyRaw
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
      const rawMasterKeyHex = sessionStorage.getItem("masterKey");
      if (password && rawMasterKeyHex) {
        const masterKey = await importMasterKeyRaw(rawMasterKeyHex);
        // We use email as userSalt context or derive from existing salt
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

  const handleDeleteAccount = async () => {
    setError("");
    setDeleteLoading(true);

    try {
      await axios.delete(`${API}/api/auth/account`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      localStorage.removeItem("token");
      localStorage.removeItem("email");
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

        {/* Danger Zone: Delete Account */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
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
