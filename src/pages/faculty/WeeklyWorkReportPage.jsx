import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, Trash2, Loader2, Send, CheckCircle2, Info, Pencil, X, Lock, Clock } from "lucide-react";
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

const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v;

// Dates are handled as "YYYY-MM-DD" in IST — the server sends today/weekStart
// that way, and entry dates are stored as IST midnight.
const dayKey = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dayLabel = (key) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short" });

// Hours between two "HH:MM" times, rounded to a quarter hour.
const hoursBetween = (from, to) => {
  if (!from || !to) return "";
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const mins = th * 60 + tm - (fh * 60 + fm);
  return mins > 0 ? String(Math.round((mins / 60) * 4) / 4) : "";
};

const emptyEntry = (today) => ({ taskName: "", date: today || "", timeFrom: "", timeTo: "", totalHours: "", status: "pending", note: "" });

const inputCls = "bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] disabled:opacity-50";
const labelCls = "flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1";

export default function WeeklyWorkReportPage() {
  const [week, setWeek] = useState(null);
  const [form, setForm] = useState(emptyEntry());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pastReports, setPastReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [cur, mine] = await Promise.all([api.get("/weekly-work-report/current"), api.get("/weekly-work-report/mine")]);
      setWeek(cur.data.data);
      setForm((f) => (f.date ? f : emptyEntry(cur.data.data.today)));
      setPastReports(mine.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your weekly report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setField = (patch) =>
    setForm((f) => {
      const next = { ...f, ...patch };
      // Fill hours from the times unless the user typed their own.
      if (("timeFrom" in patch || "timeTo" in patch) && (f.totalHours === "" || f.totalHours === hoursBetween(f.timeFrom, f.timeTo))) {
        next.totalHours = hoursBetween(next.timeFrom, next.timeTo);
      }
      return next;
    });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyEntry(week?.today));
  };

  const saveEntry = async (e) => {
    e.preventDefault();
    if (!form.taskName.trim() || !form.date || !form.timeFrom || !form.timeTo || form.totalHours === "") {
      return toast.error("Fill in the work, date, from/to time and hours");
    }
    setSaving(true);
    try {
      const { data } = editingId
        ? await api.put(`/weekly-work-report/entries/${editingId}`, form)
        : await api.post("/weekly-work-report/entries", form);
      setWeek(data.data);
      toast.success(data.message);
      setEditingId(null);
      setForm({ ...emptyEntry(week?.today), date: form.date }); // keep the day for the next entry
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the entry");
    } finally {
      setSaving(false);
    }
  };

  const editEntry = (t) => {
    setEditingId(t._id);
    setForm({
      taskName: t.taskName,
      date: dayKey(t.date),
      timeFrom: t.timeFrom,
      timeTo: t.timeTo,
      totalHours: String(t.totalHours),
      status: t.status,
      note: t.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEntry = async (t) => {
    if (!window.confirm(`Delete "${t.taskName}"?`)) return;
    try {
      const { data } = await api.delete(`/weekly-work-report/entries/${t._id}`);
      setWeek(data.data);
      if (editingId === t._id) resetForm();
      toast.success("Entry deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the entry");
    }
  };

  const submit = async () => {
    const n = week.tasks.length;
    if (!window.confirm(`Submit this week's report with ${n} entr${n === 1 ? "y" : "ies"}? You can't change it after submitting.`)) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/weekly-work-report/submit");
      toast.success(data.message || "Weekly report submitted");
      resetForm();
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit weekly report");
    } finally {
      setSubmitting(false);
    }
  };

  // Entries grouped by day, in date order.
  const byDay = [];
  for (const t of week?.tasks || []) {
    const key = dayKey(t.date);
    const group = byDay.find((g) => g.key === key);
    if (group) group.tasks.push(t);
    else byDay.push({ key, tasks: [t] });
  }
  const weekHours = Math.round((week?.tasks || []).reduce((s, t) => s + Number(t.totalHours || 0), 0) * 100) / 100;
  const canEdit = !!week?.canEdit;
  const fridayLabel = week ? dayLabel(week.friday) : "";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ClipboardList size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Weekly Work Report</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Add your work every day — it's saved as you go. Submit it on {week?.submissionDay || 'Friday'} before {week?.submissionTime || '4:10 PM'};
            anything you've filled in is submitted automatically at that time, and a status mail goes to you and your HOD.
          </p>
        </div>
      </header>

      {loading || !week ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <>
          {/* Week status */}
          {week.submitted ? (
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-green-500/20 bg-green-500/5">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              This week's report was submitted on {new Date(week.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              {week.autoSubmitted ? " (submitted automatically at the deadline)" : ""}. The next week has already started.
            </div>
          ) : week.closed ? (
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-red-500/20 bg-red-500/5">
              <Lock size={16} className="text-red-500 shrink-0" />
              This week closed at {week.submissionTime} on {week.submissionDay} with no entries — you and your HOD have been mailed. The next week has already started.
            </div>
          ) : week.isFriday ? (
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-amber-500/20 bg-amber-500/5">
              <Clock size={16} className="text-amber-500 shrink-0" />
              Today is {week.submissionDay} — submit before <strong className="text-[var(--text-primary)]">{week.submissionTime}</strong>. Anything you've added is submitted automatically at that time.
            </div>
          ) : (
            <div className="glass-card p-4 rounded-2xl flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-[var(--border-light)]">
              <Info size={16} className="text-[var(--primary)] shrink-0" />
              Keep adding your daily work. Submit opens on {fridayLabel} (until {week.submissionTime}), and whatever you've added is submitted automatically then.
            </div>
          )}

          {/* Add / edit entry */}
          {canEdit && (
            <form onSubmit={saveEntry} className="glass-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{editingId ? "Edit Entry" : "Add Today's Work"}</h3>
                {editingId && (
                  <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1 text-[var(--text-secondary)]">
                    <X size={12} /> Cancel edit
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2">
                <label className={`${labelCls} lg:col-span-3`}>
                  Work done
                  <input value={form.taskName} onChange={(e) => setField({ taskName: e.target.value })} placeholder="e.g. Took DBMS lab for 5th sem, Section 2" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Date
                  <input type="date" value={form.date} min={week.weekStart} max={week.today} onChange={(e) => setField({ date: e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>
                  From
                  <input type="time" value={form.timeFrom} onChange={(e) => setField({ timeFrom: e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>
                  To
                  <input type="time" value={form.timeTo} onChange={(e) => setField({ timeTo: e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>
                  Hours
                  <input type="number" min="0" max="24" step="0.25" value={form.totalHours} onChange={(e) => setField({ totalHours: e.target.value })} className={inputCls} />
                </label>
                <label className={labelCls}>
                  Status
                  <select value={form.status} onChange={(e) => setField({ status: e.target.value })} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
                <label className={`${labelCls} lg:col-span-4`}>
                  Note (optional)
                  <input value={form.note} onChange={(e) => setField({ note: e.target.value })} className={inputCls} />
                </label>
              </div>
              <button type="submit" disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : editingId ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                {editingId ? "Update Entry" : "Add Entry"}
              </button>
            </form>
          )}

          {/* This week's entries */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-light)] flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-[var(--text-secondary)]">
                This week · {dayLabel(week.weekStart)} – {fridayLabel} · {week.tasks.length} entr{week.tasks.length === 1 ? "y" : "ies"} · {weekHours} h
              </div>
              {!week.submitted && !week.closed && (
                <button
                  onClick={submit}
                  disabled={!week.canSubmit || submitting}
                  className="btn-premium text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
                  title={!week.isFriday ? `Submit opens on ${fridayLabel}` : week.tasks.length === 0 ? "Add at least one entry first" : ""}
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit Weekly Report
                </button>
              )}
            </div>
            {byDay.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No entries yet this week — add what you worked on today.</div>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {byDay.map((g) => (
                  <div key={g.key} className="p-4 space-y-2">
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {dayLabel(g.key)} <span className="text-[var(--text-secondary)] font-medium">· {g.tasks.reduce((s, t) => s + Number(t.totalHours || 0), 0)} h</span>
                    </div>
                    {g.tasks.map((t) => (
                      <div key={t._id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-[var(--text-primary)]">{t.taskName}</span>
                        <span className="text-[var(--text-secondary)]">{t.timeFrom}–{t.timeTo} · {t.totalHours}h</span>
                        <span className={`badge ${STATUS_BADGE[t.status] || ""}`}>{statusLabel(t.status)}</span>
                        {t.note && <span className="text-[var(--text-secondary)] italic">{t.note}</span>}
                        {canEdit && (
                          <span className="ml-auto flex gap-1">
                            <button onClick={() => editEntry(t)} title="Edit" className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--primary)]"><Pencil size={13} /></button>
                            <button onClick={() => deleteEntry(t)} title="Delete" className="p-1 rounded text-[var(--text-secondary)] hover:text-red-500"><Trash2 size={13} /></button>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">Past Reports</div>
            {pastReports.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No weekly reports submitted yet.</div>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {pastReports.map((r) => (
                  <div key={r._id} className="p-4 space-y-2">
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                      Week ending {new Date(r.weekOf).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} · {r.tasks.length} task{r.tasks.length === 1 ? "" : "s"}
                    </div>
                    <div className="space-y-1.5">
                      {r.tasks.map((t) => (
                        <div key={t._id} className="text-xs flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)]">{t.taskName}</span>
                          <span className="text-[var(--text-secondary)]">
                            {new Date(t.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} · {t.timeFrom}-{t.timeTo} · {t.totalHours}h
                          </span>
                          <span className={`badge ${STATUS_BADGE[t.status] || ""}`}>{statusLabel(t.status)}</span>
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
