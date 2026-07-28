import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  BarChart3,
  Check,
  Sun
} from "lucide-react";
import { useAuthModal } from "../context/useAuthModal";
import "./Home.css";
import "../App.css";

function Home() {
  const token = localStorage.getItem("token");
  const { openAuthModal } = useAuthModal();

  // Sample Interactive Demo State for Homepage Preview Card
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, text: "Design high-converting Landing Page", priority: "high", category: "Work", completed: true },
    { id: 2, text: "Review backend API deployment on Render", priority: "medium", category: "Work", completed: false },
    { id: 3, text: "Buy groceries & weekly supplies", priority: "low", category: "Shopping", completed: false }
  ]);

  const toggleDemoTask = (id) => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="home-content-body">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill-badge">
          <Sparkles size={15} />
          <span>Task Management with Simplicity</span>
        </div>

        <h1 className="hero-headline">
          Organize your work & life with{" "}
          <span className="hero-gradient-text">effortless precision.</span>
        </h1>

        <p className="hero-subtext">
          TaskFlow gives you real-time cloud synchronization, smart priority tagging, and clean aesthetics—keeping you focused on what matters most.
        </p>

        <div className="hero-cta-group">
          {token ? (
            <Link to="/todo" className="btn-hero-primary">
              <span>Open Your Reminders</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <button
                className="btn-hero-primary"
                onClick={() => openAuthModal("register")}
              >
                <span>Start Free Account</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="btn-hero-secondary"
                onClick={() => openAuthModal("login")}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Interactive macOS Preview Card */}
        <div className="preview-container apple-slide">
          <div className="preview-top-bar">
            <div className="window-dot dot-red"></div>
            <div className="window-dot dot-yellow"></div>
            <div className="window-dot dot-green"></div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginLeft: 8 }}>
              TaskFlow Reminders Preview
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Today's Reminders
            </div>
            <span style={{ fontSize: 12, color: 'var(--apple-blue)', fontWeight: 600 }}>
              Live Interactive Demo
            </span>
          </div>

          <div className="apple-task-list">
            {demoTasks.map((todo) => (
              <div
                key={todo.id}
                className={`apple-task-item ${todo.completed ? "is-done" : ""}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleDemoTask(todo.id)}
              >
                <div className="task-left-section">
                  <div
                    className={`apple-circular-check ${todo.completed ? "checked" : ""}`}
                  >
                    {todo.completed && <Check size={14} strokeWidth={3} />}
                  </div>

                  <div>
                    <div className={`apple-task-title ${todo.completed ? "strike" : ""}`}>
                      {todo.text}
                    </div>

                    <div className="apple-meta-row">
                      <span className={`apple-badge badge-${todo.priority}`}>
                        {todo.priority}
                      </span>
                      <span className="apple-badge badge-cat">
                        {todo.category}
                      </span>
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Click to check
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="features-section" id="features">
        <div className="section-header-center">
          <div className="section-tag">Powerful Functionality</div>
          <h2 className="section-title">Designed for focus and speed</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card-apple">
            <div className="feature-icon-box icon-blue-box">
              <Layers size={24} />
            </div>
            <h3 className="feature-card-title">Smart Priorities & Categories</h3>
            <p className="feature-card-desc">
              Organize your tasks seamlessly with color-coded High, Medium, and Low flags, along with custom Work, Personal, and Shopping categories.
            </p>
          </div>

          <div className="feature-card-apple">
            <div className="feature-icon-box icon-purple-box">
              <Zap size={24} />
            </div>
            <h3 className="feature-card-title">Real-Time Cloud Sync</h3>
            <p className="feature-card-desc">
              Deploys on Render backend with MongoDB Atlas database for instant, encrypted data availability across all your desktop and mobile browser sessions.
            </p>
          </div>

          <div className="feature-card-apple">
            <div className="feature-icon-box icon-orange-box">
              <Sun size={24} />
            </div>
            <h3 className="feature-card-title">Dual Light & Dark Theme</h3>
            <p className="feature-card-desc">
              Switch effortlessly between clean Apple Light mode and OLED Dark mode with automatic system preference detection and memory.
            </p>
          </div>

          <div className="feature-card-apple">
            <div className="feature-icon-box icon-green-box">
              <BarChart3 size={24} />
            </div>
            <h3 className="feature-card-title">Progress & Analytics</h3>
            <p className="feature-card-desc">
              Track your daily completion rate with visual stat counters and real-time progress bars to stay motivated.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section" id="workflow">
        <div className="workflow-container">
          <div className="section-header-center">
            <div className="section-tag">Simple 3-Step Workflow</div>
            <h2 className="section-title">How TaskFlow elevates your day</h2>
          </div>

          <div className="workflow-steps-grid">
            <div className="step-card">
              <div className="step-num-badge">1</div>
              <h3 className="step-title">Quick Capture</h3>
              <p className="step-desc">
                Instantly type your reminders using the floating input bar without friction.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">2</div>
              <h3 className="step-title">Tag & Prioritize</h3>
              <p className="step-desc">
                Set priority levels and assign categories for clear visual hierarchy.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">3</div>
              <h3 className="step-title">Achieve & Sync</h3>
              <p className="step-desc">
                Mark tasks complete with satisfying circular checkmarks and track your progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="cta-banner-section" id="about">
        <div className="cta-banner-card">
          <h2 className="cta-banner-title">Ready to streamline your workflow?</h2>
          <p className="cta-banner-sub">
            Join users who organize their work and life with TaskFlow. Free forever account with instant access.
          </p>
          {token ? (
            <Link to="/todo" className="btn-cta-white">
              <span>Go to My Reminders</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <button
              className="btn-cta-white"
              onClick={() => openAuthModal("register")}
            >
              <span>Create Free Account</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
