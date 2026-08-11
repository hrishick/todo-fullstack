import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  CheckSquare,
  Plus,
  Search,
  Check,
  Edit3,
  Trash2,
  ListTodo,
  Clock,
  CheckCircle2,
  X,
  Tag,
  AlertCircle
} from "lucide-react";
import { importMasterKeyRaw, encryptText, decryptText } from "../utils/crypto";
import API from "../config";
import "../App.css";

function Todo() {

  const [taskText, setTaskText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("General");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'completed'
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editCategory, setEditCategory] = useState("General");

  // Alert State
  const [errorMessage, setErrorMessage] = useState("");

  const token = localStorage.getItem("token");

  const axiosConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
    [token]
  );

  // Helper to get active master key from session or persistent local storage
  const getMasterKeyHex = () => sessionStorage.getItem("masterKey") || localStorage.getItem("masterKey");

  // Load and Decrypt tasks from API
  const getTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/tasks`, axiosConfig);
      
      const rawMasterKeyHex = getMasterKeyHex();
      if (rawMasterKeyHex) {
        try {
          const masterKey = await importMasterKeyRaw(rawMasterKeyHex);
          const decryptedList = await Promise.all(
            res.data.map(async (task) => ({
              ...task,
              text: await decryptText(task.text, masterKey),
              priority: await decryptText(task.priority, masterKey),
              category: await decryptText(task.category, masterKey)
            }))
          );
          setTasks(decryptedList);
          return;
        } catch (decryptErr) {
          console.error("Task decryption failed:", decryptErr);
        }
      }

      // Check if tasks contain encrypted ciphertexts but masterKey is missing
      const hasEncryptedData = res.data.some((task) => task.text && typeof task.text === "string" && task.text.startsWith("enc:v1:"));
      if (hasEncryptedData && !rawMasterKeyHex) {
        setErrorMessage("Your reminders are locked. Please Sign Out and Sign In again to unlock your Zero-Knowledge keys.");
      }

      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  useEffect(() => {
    getTasks();
  }, [getTasks]);

  // Add new encrypted task
  const addTask = async (e) => {
    if (e) e.preventDefault();
    if (taskText.trim() === "") return;

    try {
      setErrorMessage("");

      let payloadText = taskText;
      let payloadPriority = priority;
      let payloadCategory = category;

      const rawMasterKeyHex = getMasterKeyHex();
      if (rawMasterKeyHex) {
        const masterKey = await importMasterKeyRaw(rawMasterKeyHex);
        payloadText = await encryptText(taskText, masterKey);
        payloadPriority = await encryptText(priority, masterKey);
        payloadCategory = await encryptText(category, masterKey);
      }

      await axios.post(
        `${API}/api/tasks`,
        {
          text: payloadText,
          priority: payloadPriority,
          category: payloadCategory
        },
        axiosConfig
      );

      setTaskText("");
      setPriority("medium");
      setCategory("General");
      getTasks();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to add task.");
    }
  };

  // Toggle complete state
  const toggleComplete = async (todo) => {
    try {
      await axios.put(
        `${API}/api/tasks/${todo._id}`,
        {
          completed: !todo.completed
        },
        axiosConfig
      );
      getTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Open edit modal
  const openEditModal = (todo) => {
    setEditingTask(todo);
    setEditText(todo.text);
    setEditPriority(todo.priority || "medium");
    setEditCategory(todo.category || "General");
  };

  // Save edited encrypted task
  const saveEditedTask = async (e) => {
    if (e) e.preventDefault();
    if (!editingTask || editText.trim() === "") return;

    try {
      let payloadText = editText;
      let payloadPriority = editPriority;
      let payloadCategory = editCategory;

      const rawMasterKeyHex = getMasterKeyHex();
      if (rawMasterKeyHex) {
        const masterKey = await importMasterKeyRaw(rawMasterKeyHex);
        payloadText = await encryptText(editText, masterKey);
        payloadPriority = await encryptText(editPriority, masterKey);
        payloadCategory = await encryptText(editCategory, masterKey);
      }

      await axios.put(
        `${API}/api/tasks/${editingTask._id}`,
        {
          text: payloadText,
          priority: payloadPriority,
          category: payloadCategory
        },
        axiosConfig
      );
      setEditingTask(null);
      getTasks();
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update task.");
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API}/api/tasks/${id}`, axiosConfig);
      getTasks();
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete task.");
    }
  };

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((todo) => {
      const matchesSearch = todo.text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = !todo.completed;
      if (statusFilter === "completed") matchesStatus = todo.completed;

      let matchesCategory = true;
      if (categoryFilter !== "all")
        matchesCategory = todo.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tasks, searchQuery, statusFilter, categoryFilter]);

  // Statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const activeTasksCount = totalTasksCount - completedTasksCount;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="dashboard-apple apple-fade">

      {errorMessage && (
        <div
          className="apple-alert apple-alert-error apple-fade"
          style={{ marginBottom: 20 }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button
            style={{
              background: "none",
              border: "none",
              color: "currentColor",
              marginLeft: "auto",
              cursor: "pointer"
            }}
            onClick={() => setErrorMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Reminders Stat Cards */}
      <div className="apple-stat-grid">
        <div className="apple-stat-card">
          <div className="stat-circle-icon stat-circle-blue">
            <ListTodo size={20} />
          </div>
          <div>
            <div className="stat-number">{totalTasksCount}</div>
            <div className="stat-title">Total Tasks</div>
          </div>
        </div>

        <div className="apple-stat-card">
          <div className="stat-circle-icon stat-circle-orange">
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-number">{activeTasksCount}</div>
            <div className="stat-title">In Progress</div>
          </div>
        </div>

        <div className="apple-stat-card">
          <div className="stat-circle-icon stat-circle-green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-number">{completedTasksCount}</div>
            <div className="stat-title">Completed</div>
          </div>
        </div>
      </div>

      {/* Floating Input Creator Card */}
      <div className="apple-creator-card">
        <form onSubmit={addTask}>
          <div className="creator-top-row">
            <input
              type="text"
              className="apple-creator-input"
              placeholder="New Reminder..."
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
            />
            <button type="submit" className="btn-apple-add">
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>

          <div className="creator-options-row">
            <div className="apple-chip-group">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  marginRight: 4
                }}
              >
                Priority:
              </span>
              <button
                type="button"
                className={`apple-chip ${
                  priority === "low" ? "chip-low" : ""
                }`}
                onClick={() => setPriority("low")}
              >
                Low
              </button>
              <button
                type="button"
                className={`apple-chip ${
                  priority === "medium" ? "chip-medium" : ""
                }`}
                onClick={() => setPriority("medium")}
              >
                Medium
              </button>
              <button
                type="button"
                className={`apple-chip ${
                  priority === "high" ? "chip-high" : ""
                }`}
                onClick={() => setPriority("high")}
              >
                High
              </button>
            </div>

            <div className="apple-chip-group">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  marginRight: 4
                }}
              >
                Category:
              </span>
              <select
                className="apple-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Segmented Filter Control & Search */}
      <div className="segmented-wrapper">
        <div className="apple-search-box">
          <Search className="apple-search-icon" size={15} />
          <input
            type="text"
            className="apple-search-input"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="apple-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Shopping">Shopping</option>
          </select>

          <div className="apple-segmented-control">
            <button
              className={`segmented-btn ${
                statusFilter === "all" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              className={`segmented-btn ${
                statusFilter === "active" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>
            <button
              className={`segmented-btn ${
                statusFilter === "completed" ? "active" : ""
              }`}
              onClick={() => setStatusFilter("completed")}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-tertiary)",
            fontSize: 14
          }}
        >
          Loading reminders...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "var(--bg-card)",
            borderRadius: 20,
            border: "1px solid var(--border-subtle)"
          }}
          className="apple-fade"
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(0, 122, 255, 0.1)",
              color: "var(--apple-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px"
            }}
          >
            <CheckSquare size={24} />
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)"
            }}
          >
            {tasks.length === 0 ? "No Reminders" : "No Matching Reminders"}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 4
            }}
          >
            {tasks.length === 0
              ? "Type a title above and press Add to create your first reminder."
              : "Try changing your search term or category filters."}
          </p>
        </div>
      ) : (
        <div className="apple-task-list">
          {filteredTasks.map((todo) => (
            <div
              key={todo._id}
              className={`apple-task-item apple-slide ${
                todo.completed ? "is-done" : ""
              }`}
            >
              <div className="task-left-section">
                <button
                  className={`apple-circular-check ${
                    todo.completed ? "checked" : ""
                  }`}
                  onClick={() => toggleComplete(todo)}
                  title={
                    todo.completed ? "Mark as active" : "Mark as completed"
                  }
                >
                  {todo.completed && <Check size={14} strokeWidth={3} />}
                </button>

                <div>
                  <div
                    className={`apple-task-title ${
                      todo.completed ? "strike" : ""
                    }`}
                  >
                    {todo.text}
                  </div>

                  <div className="apple-meta-row">
                    <span
                      className={`apple-badge badge-${
                        todo.priority || "medium"
                      }`}
                    >
                      {todo.priority || "medium"}
                    </span>

                    <span className="apple-badge badge-cat">
                      <Tag
                        size={10}
                        style={{ marginRight: 3, display: "inline-block" }}
                      />
                      {todo.category || "General"}
                    </span>

                    {todo.createdAt && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-tertiary)",
                          marginLeft: 4
                        }}
                      >
                        {formatDate(todo.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="apple-task-actions">
                <button
                  className="btn-apple-action"
                  onClick={() => openEditModal(todo)}
                  title="Edit Reminder"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  className="btn-apple-action delete"
                  onClick={() => deleteTask(todo._id)}
                  title="Delete Reminder"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* macOS Sheet Edit Modal */}
      {editingTask && (
        <div className="apple-modal-overlay apple-fade">
          <div className="apple-modal-sheet">
            <div className="modal-header-apple">
              <h3>Edit Reminder</h3>
              <button
                className="btn-modal-cancel"
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={saveEditedTask}>
              <div className="apple-field-group">
                <label className="apple-label">Title</label>
                <input
                  type="text"
                  className="apple-input"
                  style={{ paddingLeft: 14 }}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  required
                />
              </div>

              <div className="apple-field-group" style={{ marginTop: 14 }}>
                <label className="apple-label">Priority</label>
                <div className="apple-chip-group" style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className={`apple-chip ${
                      editPriority === "low" ? "chip-low" : ""
                    }`}
                    onClick={() => setEditPriority("low")}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    className={`apple-chip ${
                      editPriority === "medium" ? "chip-medium" : ""
                    }`}
                    onClick={() => setEditPriority("medium")}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    className={`apple-chip ${
                      editPriority === "high" ? "chip-high" : ""
                    }`}
                    onClick={() => setEditPriority("high")}
                  >
                    High
                  </button>
                </div>
              </div>

              <div className="apple-field-group" style={{ marginTop: 14 }}>
                <label className="apple-label">Category</label>
                <select
                  className="apple-select"
                  style={{ width: "100%", marginTop: 4, padding: "10px 14px" }}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 24
                }}
              >
                <button
                  type="submit"
                  className="btn-apple-primary"
                  style={{ width: "auto", padding: "10px 24px" }}
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Todo;