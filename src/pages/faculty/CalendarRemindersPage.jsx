import { useState, useEffect } from "react";
import { BellRing, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const emptyForm = () => ({ date: "", time: "", title: "", note: "" });

export default function CalendarRemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/calendar-reminders");
      if (data.success) setReminders(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.title.trim()) {
      return toast.error("Date, time and title are required");
    }
    setSaving(true);
    try {
      const { data } = await api.post("/calendar-reminders", form);
      if (data.success) {
        toast.success("Reminder set");
        setForm(emptyForm());
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set reminder");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/calendar-reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete reminder");
    }
  };

  const now = new Date();
  const isPast = (r) => {
    const [hh, mm] = r.time.split(":").map(Number);
    const target = new Date(r.date);
    target.setHours(hh || 0, mm || 0, 0, 0);
    return target < now;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <BellRing size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">My Reminders</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Set a reminder for any date — an alarm rings (with sound) at that time while you have the site open.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Add Reminder</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Date
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Time
            <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1 lg:col-span-2">
            Title
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Submit MST marks" className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Note <span className="normal-case font-medium opacity-70">(optional)</span>
          <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
        </label>
        <button type="submit" disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Set Reminder
        </button>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
          All Reminders
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : reminders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No reminders set yet.</div>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            {reminders.map((r) => (
              <div key={r._id} className={`flex items-center justify-between gap-3 px-4 py-3 ${isPast(r) && !r.dismissedAt ? "bg-red-500/5" : ""}`}>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">{r.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {new Date(r.date).toLocaleDateString()} at {r.time}
                    {r.note && <span> · {r.note}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.dismissedAt ? (
                    <span className="badge bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]">Dismissed</span>
                  ) : isPast(r) ? (
                    <span className="badge bg-red-500/10 text-red-500">Due</span>
                  ) : (
                    <span className="badge bg-green-500/10 text-green-500">Upcoming</span>
                  )}
                  <button onClick={() => remove(r._id)} className="text-[var(--text-secondary)] hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
