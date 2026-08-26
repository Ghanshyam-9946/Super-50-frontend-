import { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2, Loader2, Send, CheckCircle2, Info } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "on_track", label: "On Track" },
  { value: "complete", label: "Complete" },
  { value: "reject", label: "Reject" },
];

const STATUS_BADGE = {
  pending: "bg-amber-500/10 text-amber-500",
  on_track: "bg-blue-500/10 text-blue-500",
  complete: "bg-green-500/10 text-green-500",
  reject: "bg-red-500/10 text-red-500",
};

const emptyTask = () => ({
  taskName: "",
  totalHours: "",
  date: new Date().toISOString().slice(0, 10),
  timeFrom: "",
  timeTo: "",
  status: "pending",
  note: "",
});

export default function WeeklyWorkReportPage() {
  const [status, setStatus] = useState(null); // { isFriday, alreadySubmitted, canSubmit }
  const [tasks, setTasks] = useState([emptyTask()]);
  const [submitting, setSubmitting] = useState(false);
  const [pastReports, setPastReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statusRes, mineRes] = await Promise.all([
        api.get("/weekly-work-report/status"),
        api.get("/weekly-work-report/mine"),
      ]);
      if (statusRes.data.success) setStatus(statusRes.data);
      if (mineRes.data.success) setPastReports(mineRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load weekly report status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const addTask = () => setTasks((prev) => [...prev, emptyTask()]);
  const removeTask = (idx) => setTasks((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updateTask = (idx, patch) => setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const submit = async () => {
    for (const t of tasks) {
      if (!t.taskName.trim() || t.totalHours === "" || !t.date || !t.timeFrom || !t.timeTo) {
        return toast.error("Every task needs a name, total hours, date, and from/to time");
      }
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/weekly-work-report/submit", { tasks });
      if (data.success) {
        toast.success(data.message || "Weekly report submitted");
        setTasks([emptyTask()]);
        loadAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit weekly report");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = status?.canSubmit;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ClipboardList size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Weekly Work Report</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Log your working details every Friday — the submit button only opens on Fridays and locks once the day passes.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <>
          {!status?.isFriday && (
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-amber-500/20 bg-amber-500/5">
              <Info size={16} className="text-amber-500 shrink-0" />
              Submission opens every Friday. Come back then to submit this week's report.
            </div>
          )}
          {status?.isFriday && status?.alreadySubmitted && (
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-green-500/20 bg-green-500/5">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              You've already submitted this week's report — see it below.
            </div>
          )}

          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">This Week's Tasks</h3>
              <button
                onClick={addTask}
                disabled={!canSubmit}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={12} /> Add Task
              </button>
            </div>

            {tasks.map((t, idx) => (
              <div key={idx} className="bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-3 space-y-2">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1 lg:col-span-2">
                    Task Name
                    <input
                      disabled={!canSubmit}
                      value={t.taskName}
                      onChange={(e) => updateTask(idx, { taskName: e.target.value })}
                      placeholder="e.g. Prepared lecture notes for Unit 3"
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                    />
                  </label>
                  <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                    Total Hours
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      disabled={!canSubmit}
                      value={t.totalHours}
                      onChange={(e) => updateTask(idx, { totalHours: e.target.value })}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                    />
                  </label>
                  <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                    Date
                    <input
                      type="date"
                      disabled={!canSubmit}
                      value={t.date}
                      onChange={(e) => updateTask(idx, { date: e.target.value })}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                    />
                  </label>
                  <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                    Time From
                    <input
                      type="time"
                      disabled={!canSubmit}
                      value={t.timeFrom}
                      onChange={(e) => updateTask(idx, { timeFrom: e.target.value })}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                    />
                  </label>
                  <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                    Time To
                    <input
                      type="time"
                      disabled={!canSubmit}
                      value={t.timeTo}
                      onChange={(e) => updateTask(idx, { timeTo: e.target.value })}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                    />
                  </label>
                  <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                    Status
                    <select
                      disabled={!canSubmit}
                      value={t.status}
                      onChange={(e) => updateTask(idx, { status: e.target.value })}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                  Note
                  <textarea
                    disabled={!canSubmit}
                    value={t.note}
                    onChange={(e) => updateTask(idx, { note: e.target.value })}
                    rows={1}
                    className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                  />
                </label>
                {tasks.length > 1 && (
                  <button onClick={() => removeTask(idx)} disabled={!canSubmit} className="text-xs text-red-400 flex items-center gap-1 disabled:opacity-40">
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
              title={!status?.isFriday ? "Submissions only open on Friday" : status?.alreadySubmitted ? "Already submitted this week" : ""}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit Weekly Report
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
              Past Reports
            </div>
            {pastReports.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No weekly reports submitted yet.</div>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {pastReports.map((r) => (
                  <div key={r._id} className="p-4 space-y-2">
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                      Week of {new Date(r.weekOf).toLocaleDateString()} · {r.tasks.length} task{r.tasks.length === 1 ? "" : "s"}
                    </div>
                    <div className="space-y-1.5">
                      {r.tasks.map((t) => (
                        <div key={t._id} className="text-xs flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)]">{t.taskName}</span>
                          <span className="text-[var(--text-secondary)]">
                            {new Date(t.date).toLocaleDateString()} · {t.timeFrom}-{t.timeTo} · {t.totalHours}h
                          </span>
                          <span className={`badge ${STATUS_BADGE[t.status] || ""}`}>
                            {STATUS_OPTIONS.find((s) => s.value === t.status)?.label || t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
