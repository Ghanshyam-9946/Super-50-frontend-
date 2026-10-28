import { useEffect, useState } from "react";
import { FileText, Loader2, Send, Paperclip, History, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { LeaveRow, StatusBadge, fmtDate } from "./leaveShared";

const OPEN = ["pending_tg", "pending_admin"];
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ subject: "", fromDate: today(), toDate: today(), reason: "", parentInformed: "yes" });

const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

export default function StudentLeavePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [file, setFile] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/leave/mine");
      setItems(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load your applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const open = items.find((a) => OPEN.includes(a.status));

  // While it is being reviewed, poll so the status moves without a refresh.
  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?._id, open?.status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error("Please write the subject");
    if (!form.reason.trim()) return toast.error("Please write the reason for leave");
    if (file && file.size > 1024 * 1024) return toast.error("The attachment must be 1MB or smaller");

    setSending(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("parentInformed", form.parentInformed === "yes");
      if (file) fd.append("attachment", file);
      const { data } = await api.post("/leave", fd);
      toast.success(data.message);
      setForm(emptyForm());
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send the application");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <FileText className="text-[var(--primary)]" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Leave Application</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Apply for leave here. Your TG reviews it first, then the admin — you will be emailed once it is approved.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 rounded-3xl flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : (
        <>
          {open && (
            <div className="glass-card p-6 rounded-3xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Current application</div>
                  <div className="font-bold text-[var(--text-primary)] mt-1">{open.subject}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {fmtDate(open.fromDate)} → {fmtDate(open.toDate)} · {open.days} day{open.days === 1 ? "" : "s"}
                  </div>
                </div>
                <StatusBadge status={open.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] rounded-2xl p-4">
                <Clock size={15} />
                {open.status === "pending_tg"
                  ? "Your TG has the application. Once they approve, it goes to the admin."
                  : "Your TG approved it. Waiting for the admin's final approval."}
              </div>
              {open.tgDecision?.remark && <p className="text-xs text-[var(--text-secondary)]">TG remark: {open.tgDecision.remark}</p>}
            </div>
          )}

          {!open && (
            <form onSubmit={submit} className="glass-card p-6 rounded-3xl space-y-4">
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">New application</h2>
              <label className={labelCls}>
                Subject
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Leave for sister's wedding"
                  className={`${inputCls} mt-1.5 font-normal normal-case tracking-normal`} />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={labelCls}>
                  From date
                  <input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} className={`${inputCls} mt-1.5`} />
                </label>
                <label className={labelCls}>
                  End date
                  <input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} className={`${inputCls} mt-1.5`} />
                </label>
              </div>
              <label className={labelCls}>
                Reason for leave
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3}
                  placeholder="Explain why you need the leave"
                  className={`${inputCls} mt-1.5 font-normal normal-case tracking-normal`} />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={labelCls}>
                  Is this informed to your parent?
                  <select value={form.parentInformed} onChange={(e) => setForm({ ...form, parentInformed: e.target.value })} className={`${inputCls} mt-1.5`}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className={labelCls}>
                  Attachment (optional, max 1MB)
                  <div className="mt-1.5 flex items-center gap-2">
                    <label className="text-xs font-bold px-3 py-2.5 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
                      <Paperclip size={13} /> Choose file
                      <input type="file" accept="application/pdf,image/*" className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <span className="text-xs font-normal normal-case tracking-normal text-[var(--text-secondary)] truncate">
                      {file ? file.name : "Application, event confirmation or medical note"}
                    </span>
                  </div>
                </label>
              </div>
              <button type="submit" disabled={sending} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send application
              </button>
            </form>
          )}

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">My applications</h2>
            </div>
            {items.filter((a) => a._id !== open?._id).length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No applications yet.</p>
            ) : (
              <div className="space-y-2">
                {items.filter((a) => a._id !== open?._id).map((a) => (
                  <LeaveRow key={a._id} application={a} showStudent={false} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
