import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  CheckSquare,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import { useTheme } from "../context/useTheme";
import { AuthModalProvider } from "../context/AuthModalContext";
import { useAuthModal } from "../context/useAuthModal";
import ProfileModal from "./ProfileModal";
import "../pages/Home.css";
import "../App.css";

function MainLayoutContent({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const token = localStorage.getItem("token");
  const [emailState, setEmailState] = useState(() => localStorage.getItem("email") || "User");
  const userInitial = emailState.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
    setMobileMenuOpen(false);
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenAuth = (tab) => {
    setMobileMenuOpen(false);
    openAuthModal(tab);
  };

  return (
    <div className="home-container apple-fade">
      {/* Persistent Top Header */}
      <nav className="home-navbar">
        <div className="home-nav-left">
          <a href="/" className="home-logo" onClick={handleLogoClick}>
            <div className="home-logo-icon">
              <CheckSquare size={20} />
            </div>
            <span>TaskFlow</span>
          </a>

          <ul className="home-nav-links">
            <li>
              <a
                href="#features"
                className="home-nav-link"
                onClick={(e) => scrollToSection(e, "features")}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#workflow"
                className="home-nav-link"
                onClick={(e) => scrollToSection(e, "workflow")}
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="home-nav-link"
                onClick={(e) => scrollToSection(e, "about")}
              >
                About
              </a>
            </li>

            {token && (
              <li>
                <Link
                  to="/todo"
                  className="home-nav-link"
                  style={{
                    color: location.pathname === "/todo" ? "var(--apple-blue)" : "var(--text-secondary)",
                    fontWeight: 600
                  }}
                >
                  My Reminders
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="home-nav-right">
          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {token ? (
            <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                onClick={() => setProfileModalOpen(true)}
                title="Account Settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "var(--bg-input)",
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--apple-blue)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {userInitial}
                </div>
                <span>{emailState}</span>
              </div>

              <button className="btn-apple-logout" onClick={handleLogout}>
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="desktop-only" style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-nav-outline"
                onClick={() => handleOpenAuth("login")}
              >
                Sign In
              </button>
              <button
                className="btn-nav-primary"
                onClick={() => handleOpenAuth("register")}
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            className="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer apple-fade">
            <ul className="mobile-nav-links">
              <li>
                <a
                  href="#features"
                  className="mobile-nav-link"
                  onClick={(e) => scrollToSection(e, "features")}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="mobile-nav-link"
                  onClick={(e) => scrollToSection(e, "workflow")}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="mobile-nav-link"
                  onClick={(e) => scrollToSection(e, "about")}
                >
                  About
                </a>
              </li>

              {token && (
                <>
                  <li>
                    <Link
                      to="/todo"
                      className="mobile-nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Reminders
                    </Link>
                  </li>
                  <li>
                    <button
                      className="mobile-nav-link"
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                    >
                      <User size={16} />
                      <span>Account Settings</span>
                    </button>
                  </li>
                </>
              )}
            </ul>

            <div className="mobile-cta-group">
              {token ? (
                <button
                  className="btn-apple-logout"
                  style={{ width: "100%", justifyContent: "center", padding: 12 }}
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out ({emailState})</span>
                </button>
              ) : (
                <>
                  <button
                    className="btn-nav-outline"
                    onClick={() => handleOpenAuth("login")}
                  >
                    Sign In
                  </button>
                  <button
                    className="btn-nav-primary"
                    onClick={() => handleOpenAuth("register")}
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Profile Modal */}
      {token && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdated={(newEmail) => setEmailState(newEmail)}
        />
      )}

      {/* Persistent Footer */}
      <footer className="home-footer">
        <p>TaskFlow · Built with ❤️ by Hrishick Rudhresh</p>
      </footer>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <AuthModalProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthModalProvider>
  );
}

export default MainLayout;
