import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video, Plus, Loader2, Calendar, Users, Trash2, X, Copy, Check, LogIn, Search, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const localNow = () => {
  const d = new Date(Date.now() + 10 * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = () => ({
  title: "", agenda: "", startAt: localNow(), durationMinutes: 60,
  invitees: [], allowStudents: false, studentScope: { batch: "", semester: "", section: "" },
});

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";
const labelCls = "flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

const STATUS = {
  scheduled: { label: "Scheduled", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  live: { label: "Live now", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  ended: { label: "Ended", cls: "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)]" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-600 border-red-500/30" },
};

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [canSchedule, setCanSchedule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/meetings");
      setMeetings(data.data || []);
      setCanSchedule(!!data.canSchedule);
      if (data.canSchedule) {
        const res = await api.get("/meetings/invitees");
        setPeople(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/meetings", form);
      toast.success(data.message);
      setForm(emptyForm());
      setCreating(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not schedule the meeting");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (meeting) => {
    if (!window.confirm(`Delete "${meeting.title}"?`)) return;
    try {
      await api.delete(`/meetings/${meeting._id}`);
      toast.success("Meeting removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const copyLink = async (code) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/meetings/${code}`);
      setCopied(code);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => `${p.name} ${p.email} ${p.department || ""}`.toLowerCase().includes(q));
  }, [people, search]);

  const toggleInvitee = (id) =>
    setForm((f) => ({ ...f, invitees: f.invitees.includes(id) ? f.invitees.filter((x) => x !== id) : [...f.invitees, id] }));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
            <Video size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Meetings</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Video, audio, screen share, whiteboard and chat — in the browser. Only the people you invite can join.
            </p>
          </div>
        </div>
        {canSchedule && (
          <button onClick={() => setCreating((v) => !v)} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5">
            <Plus size={15} /> Schedule meeting
          </button>
        )}
      </header>

      <div className="glass-card p-5 rounded-2xl flex flex-wrap items-end gap-3">
        <label className={`${labelCls} flex-1 min-w-[200px]`}>
          Have a room code?
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.trim())} placeholder="abc-def-ghi"
            className={`${inputCls} font-normal normal-case tracking-normal`} />
        </label>
        <button onClick={() => joinCode && navigate(`/meetings/${joinCode}`)} disabled={!joinCode}
          className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
          <LogIn size={15} /> Join
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="glass-card p-6 rounded-3xl space-y-4">
          <h2 className="font-display font-black text-lg text-[var(--text-primary)]">New meeting</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={`${labelCls} sm:col-span-2`}>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Department review — October" className={`${inputCls} font-normal normal-case tracking-normal`} required />
            </label>
            <label className={labelCls}>
              Starts at
              <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className={inputCls} required />
            </label>
            <label className={labelCls}>
              Duration (minutes)
              <input type="number" min="5" max="600" value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className={inputCls} />
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              Agenda (optional)
              <textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={2}
                className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                Invite faculty ({form.invitees.length} selected)
              </span>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                  className={`${inputCls} pl-8 py-1.5 text-xs w-48`} />
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto grid sm:grid-cols-2 gap-1.5">
              {filteredPeople.map((p) => (
                <label key={p._id} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border cursor-pointer ${
                  form.invitees.includes(p._id) ? "bg-[var(--primary)]/10 border-[var(--primary)]" : "bg-[var(--bg-input)] border-[var(--border-light)]"
                }`}>
                  <input type="checkbox" checked={form.invitees.includes(p._id)} onChange={() => toggleInvitee(p._id)} />
                  <span className="truncate">
                    <strong className="text-[var(--text-primary)]">{p.name}</strong>
                    <span className="text-[var(--text-secondary)]"> · {p.department || p.role}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-[var(--border-light)] pt-3">
            <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" checked={form.allowStudents} className="mt-0.5"
                onChange={(e) => setForm({ ...form, allowStudents: e.target.checked })} />
              <span>
                <strong className="text-[var(--text-primary)]">Open this to students (live class)</strong><br />
                Leave the boxes below empty to let any student join, or narrow it to one class.
              </span>
            </label>
            {form.allowStudents && (
              <div className="grid sm:grid-cols-3 gap-2">
                {[["batch", "Batch", "2023"], ["semester", "Semester", "5"], ["section", "Section", "A"]].map(([key, label, ph]) => (
                  <label key={key} className={labelCls}>
                    {label}
                    <input value={form.studentScope[key]} placeholder={ph}
                      onChange={(e) => setForm({ ...form, studentScope: { ...form.studentScope, [key]: e.target.value } })}
                      className={`${inputCls} font-normal normal-case tracking-normal`} />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Schedule
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-sm font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : meetings.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          {canSchedule ? "No meetings yet — schedule one." : "No meetings have been shared with you."}
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const meta = STATUS[m.status] || STATUS.scheduled;
            return (
              <div key={m._id} className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                    {m.title}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.cls}`}>{meta.label}</span>
                    {m.allowStudents && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/30">Live class</span>}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {fmt(m.startAt)}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {m.durationMinutes} min</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {(m.invitees || []).length} invited</span>
                    <span>Host: {m.host?.name}</span>
                    <span className="font-mono">{m.roomCode}</span>
                  </div>
                  {m.agenda && <p className="text-xs text-[var(--text-secondary)] mt-1">{m.agenda}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(m.roomCode)} title="Copy join link"
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)]">
                    {copied === m.roomCode ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  {m.status !== "ended" && m.status !== "cancelled" && (
                    <button onClick={() => navigate(`/meetings/${m.roomCode}`)} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5">
                      <Video size={13} /> Join
                    </button>
                  )}
                  {m.isHost && (
                    <button onClick={() => remove(m)} title="Delete" className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
        <X size={12} className="mt-0.5 shrink-0" />
        Nothing is recorded on the server. The Record button captures your own screen and saves the file straight to your computer.
      </p>
    </div>
  );
}
