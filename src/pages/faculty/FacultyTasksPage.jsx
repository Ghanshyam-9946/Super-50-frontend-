import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  PlayCircle,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Share2,
  Plus,
  Search,
  Users,
  Calendar,
  FileText,
  Paperclip,
  Flag,
  Loader2,
  X,
  ChevronRight,
  Send,
  AlertTriangle,
  Trash2,
  UserCircle2,
  Filter,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";
import { format, isValid } from "date-fns";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";

/* ─── Meta maps (kept on-theme with existing badge / accent colors) ─── */

const STATUS_META = {
  open: {
    label: "Open",
    icon: Inbox,
    color: "text-slate-500",
    ring: "bg-slate-500/10 border-slate-500/20",
    dot: "#64748b",
  },
  started: {
    label: "Started",
    icon: PlayCircle,
    color: "text-indigo-500",
    ring: "bg-indigo-500/10 border-indigo-500/20",
    dot: "#6366f1",
  },
  pending: {
    label: "Pending",
    icon: PauseCircle,
    color: "text-amber-500",
    ring: "bg-amber-500/10 border-amber-500/20",
    dot: "#f59e0b",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-500",
    ring: "bg-red-500/10 border-red-500/20",
    dot: "#ef4444",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-500",
    ring: "bg-emerald-500/10 border-emerald-500/20",
    dot: "#10b981",
  },
  forwarded: {
    label: "Forwarded",
    icon: Share2,
    color: "text-purple-500",
    ring: "bg-purple-500/10 border-purple-500/20",
    dot: "#8b5cf6",
  },
};

const PRIORITY_META = {
  high: {
    label: "High",
    accent: "#ef4444",
    ring: "bg-red-500/10 border-red-500/20 text-red-500",
  },
  medium: {
    label: "Medium",
    accent: "#f59e0b",
    ring: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  },
  low: {
    label: "Low",
    accent: "#10b981",
    ring: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  },
};

// State machine — must mirror Task.STATUS_TRANSITIONS on the backend exactly.
// This only controls which buttons are OFFERED; the backend re-validates
// every transition, so the sequence can't be bypassed even by calling the
// API directly.
//   open      -> started, pending, rejected
//   pending   -> started, rejected                 (no direct jump to completed)
//   started   -> completed, rejected                (pending is NOT offered anymore
//                                                     once a task has been started)
//   completed -> nothing (terminal)
//   rejected  -> nothing (terminal)
//   forwarded -> nothing (terminal for this thread)
const STATUS_TRANSITIONS = {
  open: ["started", "pending", "rejected"],
  pending: ["started", "rejected"],
  started: ["completed", "rejected"],
  completed: [],
  rejected: [],
  forwarded: [],
};
const FORWARDABLE_FROM = ["open", "pending", "started"];

const ACTION_META = {
  started: {
    label: "Start",
    icon: PlayCircle,
    cls: "text-indigo-500 hover:bg-indigo-500/10 border-indigo-500/20",
    prompt: "Add a comment about starting this task…",
  },
  pending: {
    label: "Pending",
    icon: PauseCircle,
    cls: "text-amber-500 hover:bg-amber-500/10 border-amber-500/20",
    prompt: "Why is this task on hold?",
  },
  completed: {
    label: "Complete",
    icon: CheckCircle2,
    cls: "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20",
    prompt: "Add a completion note…",
  },
  rejected: {
    label: "Reject",
    icon: XCircle,
    cls: "text-red-500 hover:bg-red-500/10 border-red-500/20",
    prompt: "Reason for rejecting this task…",
  },
};

const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return isValid(date) ? format(date, "dd MMM yyyy") : null;
};

/* ─────────────────────────────  PAGE  ───────────────────────────── */

export default function FacultyTasksPage() {
  const { user } = useSelector((s) => s.auth);

  const [tab, setTab] = useState("assigned"); // assigned | add | allocated
  const [stats, setStats] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [allocated, setAllocated] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/tasks/stats");
      if (data.success) setStats(data.data);
    } catch {
      /* silent — cards fall back to 0 */
    }
  }, []);

  const loadFaculty = useCallback(async () => {
    try {
      const { data } = await api.get("/tasks/faculty-list");
      if (data.success)
        setFaculty(data.data.filter((f) => f._id !== user?._id));
    } catch {
      /* silent */
    }
  }, [user?._id]);

  const loadAssigned = useCallback(async () => {
    const { data } = await api.get("/tasks/assigned");
    if (data.success) setAssigned(data.data);
  }, []);

  const loadAllocated = useCallback(async (facultyId = "") => {
    const { data } = await api.get("/tasks/allocated", {
      params: facultyId ? { faculty: facultyId } : {},
    });
    if (data.success) setAllocated(data.data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadFaculty(),
        loadAssigned(),
        loadAllocated(),
      ]);
      setLoading(false);
    })();
  }, [loadStats, loadFaculty, loadAssigned, loadAllocated]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStats(), loadAssigned(), loadAllocated()]);
  }, [loadStats, loadAssigned, loadAllocated]);

  const statCards = useMemo(
    () => [
      {
        key: "open",
        ...STATUS_META.open,
        value: stats?.open || 0,
        sub: "Open Task",
      },
      {
        key: "started",
        ...STATUS_META.started,
        value: stats?.started || 0,
        sub: "Started Task",
      },
      {
        key: "pending",
        ...STATUS_META.pending,
        value: stats?.pending || 0,
        sub: "Pending",
      },
      {
        key: "rejected",
        ...STATUS_META.rejected,
        value: stats?.rejected || 0,
        sub: "Reject",
      },
      {
        key: "completed",
        ...STATUS_META.completed,
        value: stats?.completed || 0,
        sub: "Completed",
      },
      {
        key: "forwarded",
        ...STATUS_META.forwarded,
        value: stats?.forwarded || 0,
        sub: "Forwarded",
      },
    ],
    [stats],
  );

  const tabs = [
    { key: "assigned", label: "Assigned Tasks", icon: ClipboardList },
    { key: "add", label: "Add Task", icon: Plus },
    { key: "allocated", label: "Faculty Allocated", icon: Users },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            📋 Faculty Task Manager
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Allocate, track and forward tasks across faculty —{" "}
            {stats?.total || 0} in your queue.
          </p>
        </div>
        <button
          onClick={() => setTab("add")}
          className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto"
        >
          <Plus size={16} /> Allocate New Task
        </button>
      </header>

      {/* Dashboard count cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.05,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="glass-card p-5 rounded-2xl"
          >
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${c.ring}`}
            >
              <c.icon size={18} className={c.color} />
            </div>
            <div className="text-3xl font-display font-black text-[var(--text-primary)] leading-none">
              {c.value}
            </div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">
              {c.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-light)] pb-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <t.icon size={16} /> {t.label}
              {active && (
                <motion.div
                  layoutId="taskTabUnderline"
                  className="absolute -bottom-[5px] left-3 right-3 h-[3px] rounded-full bg-[var(--primary)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">
            Loading task board…
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "assigned" && (
              <AssignedTasks
                tasks={assigned}
                faculty={faculty}
                onChange={refreshAll}
              />
            )}
            {tab === "add" && (
              <AddTaskForm
                faculty={faculty}
                onCreated={async () => {
                  await refreshAll();
                  setTab("assigned");
                }}
              />
            )}
            {tab === "allocated" && (
              <AllocatedTasks
                tasks={allocated}
                faculty={faculty}
                onFilter={loadAllocated}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ─────────────────────────  ASSIGNED (priority-wise)  ───────────────────────── */

function AssignedTasks({ tasks, faculty, onChange }) {
  const groups = useMemo(
    () => ({
      high: tasks.filter((t) => t.priority === "high"),
      medium: tasks.filter((t) => t.priority === "medium"),
      low: tasks.filter((t) => t.priority === "low"),
    }),
    [tasks],
  );

  if (tasks.length === 0) {
    return (
      <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
        <Inbox size={40} className="text-[var(--text-secondary)] opacity-50" />
        <p className="text-[var(--text-primary)] font-bold">
          No tasks assigned to you yet
        </p>
        <p className="text-[var(--text-secondary)] text-sm">
          Allocated tasks will appear here, grouped by priority.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {["high", "medium", "low"].map((p) => (
        <section key={p} className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`badge ${PRIORITY_META[p].ring}`}
              style={{ borderColor: PRIORITY_META[p].accent + "33" }}
            >
              <Flag size={12} /> {PRIORITY_META[p].label} Priority
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {groups[p].length} task{groups[p].length !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-px bg-[var(--border-light)]" />
          </div>

          {groups[p].length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] pl-1 italic">
              No {PRIORITY_META[p].label.toLowerCase()} priority tasks.
            </p>
          ) : (
            <div className="grid gap-4">
              {groups[p].map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  faculty={faculty}
                  onChange={onChange}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function TaskCard({ task, faculty, onChange }) {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // 'started' | 'pending' | 'completed' | 'rejected' | 'forward'
  const [comment, setComment] = useState("");
  const [forwardId, setForwardId] = useState("");

  const status = STATUS_META[task.status] || STATUS_META.open;
  const deadline = fmtDate(task.deadline);
  const StatusIcon = status.icon;

  // Only the statuses that are a VALID next step from where the task is
  // right now are ever offered — this is what stops anyone from acting out
  // of sequence (no jumping back to pending after starting, nothing at all
  // once completed/rejected).
  const nextActions = STATUS_TRANSITIONS[task.status] || [];
  const canForward = FORWARDABLE_FROM.includes(task.status);
  const isLocked = nextActions.length === 0 && !canForward;

  const closePanel = () => {
    setMode(null);
    setComment("");
    setForwardId("");
  };

  const confirmStatus = async (newStatus) => {
    if (!comment.trim())
      return toast.error("Please add a comment before continuing");
    setBusy(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/status`, {
        status: newStatus,
        note: comment.trim(),
      });
      if (data.success) {
        toast.success(data.message || "Task updated");
        closePanel();
        await onChange();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const confirmForward = async () => {
    if (!forwardId) return toast.error("Select a faculty to forward to");
    if (!comment.trim())
      return toast.error("Please add a comment before continuing");
    setBusy(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/forward`, {
        facultyId: forwardId,
        note: comment.trim(),
      });
      if (data.success) {
        toast.success(data.message || "Task forwarded");
        closePanel();
        await onChange();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Forward failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="glass-card p-5 rounded-2xl"
      style={{
        borderLeft: `3px solid ${PRIORITY_META[task.priority]?.accent || "#8b5cf6"}`,
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-display font-bold text-[var(--text-primary)]">
              {task.title}
            </h3>
            <span className={`badge border ${status.ring} ${status.color}`}>
              <StatusIcon size={12} /> {status.label}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-[var(--text-secondary)] font-medium">
            {task.createdBy && (
              <span className="flex items-center gap-1.5">
                <UserCircle2 size={14} /> By {task.createdBy.name}
              </span>
            )}
            {deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Due {deadline}
              </span>
            )}
            {task.forwardedTo && (
              <span className="flex items-center gap-1.5 text-purple-500">
                <Share2 size={14} /> → {task.forwardedTo.name}
              </span>
            )}
            {task.referenceFile && (
              <a
                href={getImageUrl(task.referenceFile)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[var(--primary)] hover:underline"
              >
                <Paperclip size={14} />{" "}
                {task.referenceFileName || "Reference file"}
              </a>
            )}
          </div>

          {task.status === "rejected" && task.rejectionReason && (
            <div className="mt-3 flex items-start gap-2 text-xs text-red-500 bg-red-500/5 border border-red-500/15 rounded-lg p-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />{" "}
              <span>{task.rejectionReason}</span>
            </div>
          )}

          {/* Latest comment / history trail */}
          {task.statusHistory?.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {task.statusHistory
                .slice(-2)
                .reverse()
                .map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] rounded-lg px-2.5 py-1.5"
                  >
                    <span
                      className={`font-bold shrink-0 ${STATUS_META[h.status]?.color || ""}`}
                    >
                      {STATUS_META[h.status]?.label || h.status}:
                    </span>
                    <span className="italic truncate">{h.note}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Actions — only shows what's actually a valid next step */}
        <div className="flex flex-wrap gap-2 lg:justify-end shrink-0 lg:max-w-[260px]">
          {isLocked ? (
            <span className="text-xs font-bold text-[var(--text-secondary)] italic px-1">
              No further action — task is {status.label.toLowerCase()}.
            </span>
          ) : (
            <>
              {nextActions.map((key) => {
                const a = ACTION_META[key];
                return (
                  <button
                    key={key}
                    disabled={busy}
                    onClick={() => setMode(mode === key ? null : key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${a.cls}`}
                  >
                    <a.icon size={14} /> {a.label}
                  </button>
                );
              })}
              {canForward && (
                <button
                  disabled={busy}
                  onClick={() => setMode(mode === "forward" ? null : "forward")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-500/20 text-purple-500 hover:bg-purple-500/10 text-xs font-bold transition-all disabled:opacity-40"
                >
                  <Share2 size={14} /> Forward
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inline confirm panel — every action needs a mandatory comment */}
      <AnimatePresence>
        {mode && mode !== "forward" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[var(--border-light)] flex flex-col sm:flex-row gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={ACTION_META[mode]?.prompt || "Add a comment…"}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors"
              />
              <button
                onClick={() => confirmStatus(mode)}
                disabled={busy || !comment.trim()}
                className={`px-4 py-2.5 text-xs flex items-center gap-2 justify-center rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === "rejected" ? "btn-danger" : "btn-premium"
                }`}
              >
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}{" "}
                Confirm {ACTION_META[mode]?.label}
              </button>
            </div>
          </motion.div>
        )}

        {mode === "forward" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[var(--border-light)] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={forwardId}
                  onChange={(e) => setForwardId(e.target.value)}
                  className="flex-1 bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors"
                >
                  <option value="">Select faculty to forward to…</option>
                  {faculty.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} — {f.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment about this forward…"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button
                  onClick={confirmForward}
                  disabled={busy || !comment.trim() || !forwardId}
                  className="btn-premium px-4 py-2.5 text-xs flex items-center gap-2 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}{" "}
                  Forward
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────  ADD TASK  ───────────────────────────── */

function AddTaskForm({ faculty, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
  });
  const [selected, setSelected] = useState([]);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const filtered = useMemo(
    () =>
      faculty.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          (f.email || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [faculty, search],
  );

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Task title is required");
    if (selected.length === 0)
      return toast.error("Assign the task to at least one faculty");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("priority", form.priority);
      if (form.deadline) fd.append("deadline", form.deadline);
      fd.append("assignedTo", JSON.stringify(selected));
      if (file) fd.append("referenceFile", file);

      const { data } = await api.post("/tasks", fd);
      if (data.success) {
        toast.success(data.message || "Task allocated");
        setForm({
          title: "",
          description: "",
          priority: "medium",
          deadline: "",
        });
        setSelected([]);
        setFile(null);
        await onCreated();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to allocate task");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all";
  const labelCls =
    "block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2";

  return (
    <div className="glass-card p-8 rounded-3xl max-w-4xl">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Faculty multichoice */}
        <div className="md:col-span-2">
          <label className={labelCls}>
            Faculty{" "}
            <span className="text-[var(--primary)]">(select one or more)</span>
          </label>
          <div className="border border-[var(--border-light)] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-light)] bg-[var(--bg-input)]">
              <Search size={15} className="text-[var(--text-secondary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search faculty…"
                className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]"
              />
              {selected.length > 0 && (
                <span className="badge badge-approved">
                  {selected.length} selected
                </span>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filtered.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-6">
                  No faculty found.
                </p>
              )}
              {filtered.map((f) => {
                const on = selected.includes(f._id);
                return (
                  <button
                    key={f._id}
                    onClick={() => toggle(f._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      on
                        ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                        : "hover:bg-[var(--bg-hover)] border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border-light)]"}`}
                    >
                      {on && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {f.name}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                        {f.role}
                        {f.department ? ` • ${f.department}` : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Task Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Prepare Semester 5 result analysis"
            className={inputCls}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Task Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what needs to be done…"
            className={inputCls + " resize-none"}
          />
        </div>

        <div>
          <label className={labelCls}>Task Priority</label>
          <div className="flex gap-2">
            {["high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setForm({ ...form, priority: p })}
                className={`flex-1 px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                  form.priority === p
                    ? PRIORITY_META[p].ring
                    : "border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
                style={
                  form.priority === p
                    ? { borderColor: PRIORITY_META[p].accent }
                    : {}
                }
              >
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Task Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={inputCls}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>
            Reference File / Format{" "}
            <span className="opacity-60 normal-case tracking-normal font-medium">
              (PDF, DOC, PPT, XLS, ZIP — optional)
            </span>
          </label>
          <label className="flex items-center gap-3 border border-dashed border-[var(--border-light)] rounded-xl px-4 py-3 cursor-pointer hover:border-[var(--primary)] transition-colors">
            <Paperclip size={16} className="text-[var(--primary)]" />
            <span className="text-sm text-[var(--text-secondary)] truncate">
              {file ? file.name : "Attach a reference file or format"}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
                className="ml-auto text-[var(--text-secondary)] hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[var(--border-light)]">
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-premium flex items-center gap-2 text-sm"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}{" "}
          Allocate Task
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────  FACULTY ALLOCATED LIST  ──────────────────────── */

function AllocatedTasks({ tasks, faculty, onFilter }) {
  const [filterId, setFilterId] = useState("");

  const applyFilter = async (id) => {
    setFilterId(id);
    await onFilter(id);
  };

  return (
    <div className="space-y-5">
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
          <Filter size={16} className="text-[var(--primary)]" /> View any
          faculty's tasks
        </div>
        <select
          value={filterId}
          onChange={(e) => applyFilter(e.target.value)}
          className="sm:ml-auto bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors min-w-[220px]"
        >
          <option value="">All faculty</option>
          {faculty.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name} — {f.role}
            </option>
          ))}
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <ClipboardList
            size={40}
            className="text-[var(--text-secondary)] opacity-50"
          />
          <p className="text-[var(--text-primary)] font-bold">
            No allocated tasks found
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left">
                  {[
                    "Task",
                    "Priority",
                    "Assigned To",
                    "Allocated By",
                    "Deadline",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const s = STATUS_META[t.status] || STATUS_META.open;
                  const SIcon = s.icon;
                  return (
                    <tr
                      key={t._id}
                      className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <td className="px-5 py-4 max-w-[260px]">
                        <div className="font-bold text-[var(--text-primary)] truncate">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`badge ${PRIORITY_META[t.priority]?.ring || ""}`}
                          style={{
                            borderColor:
                              (PRIORITY_META[t.priority]?.accent || "#8b5cf6") +
                              "33",
                          }}
                        >
                          {PRIORITY_META[t.priority]?.label || t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(t.assignedTo || []).map((a) => (
                            <span
                              key={a._id}
                              className="text-xs font-semibold px-2 py-1 rounded-lg bg-[var(--bg-hover)] text-[var(--text-primary)] whitespace-nowrap"
                            >
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                        {t.createdBy?.name || "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                        {fmtDate(t.deadline) || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`badge border ${s.ring} ${s.color} whitespace-nowrap`}
                        >
                          <SIcon size={12} /> {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
