import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { SEMESTERS, labelCls } from "./mstUtils";

// Bits shared by the MST Exam pages.

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`glass-card rounded-3xl w-full ${wide ? "max-w-5xl" : "max-w-2xl"} my-8 bg-[var(--bg-card)]`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
        <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]"><X size={18} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export const Stat = ({ label, value, icon: Icon, tone }) => (
  <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon size={18} /></span>
    <div className="min-w-0">
      <div className="text-xl font-display font-black text-[var(--text-primary)] tabular-nums">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate">{label}</div>
    </div>
  </div>
);

// Semester chips (several can be on).
export const SemesterPicker = ({ value, onChange, label = "Semesters" }) => (
  <div className={labelCls}>{label}
    <div className="flex flex-wrap gap-1.5">
      {SEMESTERS.map((s) => {
        const on = value.includes(s);
        return (
          <button key={s} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== s) : [...value, s].sort((a, b) => a - b))}
            className={`w-9 h-9 rounded-xl text-sm font-black border transition-colors ${on ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-light)] hover:border-[var(--primary)]"}`}>
            {s}
          </button>
        );
      })}
    </div>
  </div>
);

const QUICK = {
  allow: ["Medical certificate submitted", "Fees paid at the counter", "Approved by the Principal", "Attendance corrected by the HOD"],
  stop: ["Fees pending", "Attendance short", "Disciplinary action", "Exam form not filled"],
};

// Allow / Not allow one student by hand, with a comment (required) that is
// kept in the record and shown with the decision.
export function DecisionModal({ student, allowed, onClose, onSubmit }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 3) return;
    setBusy(true);
    try { await onSubmit(comment.trim()); } finally { setBusy(false); }
  };
  return (
    <Modal title={`${allowed ? "Allow" : "Not allow"} — ${student.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-xs rounded-2xl bg-[var(--bg-input)]/60 border border-[var(--border-light)] px-4 py-3 space-y-0.5">
          <div><b className="text-[var(--text-primary)]">{student.enrollmentNumber}</b> · Sem {student.semester ?? "—"} · Attendance {student.attendance}% · Fees due ₹{Number(student.duesFees || 0).toLocaleString("en-IN")}</div>
          <div className="text-[var(--text-secondary)]">By the rules: {student.reasons?.length ? student.reasons.join(" · ") : "allowed"}</div>
        </div>
        <label className={labelCls}>Comment (required — {allowed ? "kept in the record" : "the student sees it"})
          <textarea id="decision-comment" autoFocus rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder={allowed ? "e.g. Medical certificate submitted on 12 Nov" : "e.g. Fees of ₹5,000 pending"}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm normal-case tracking-normal font-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK[allowed ? "allow" : "stop"].map((q) => (
            <button key={q} type="button" onClick={() => setComment(q)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]">{q}</button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-outline-premium text-sm px-4 py-2">Cancel</button>
          <button id="decision-save" type="submit" disabled={busy || comment.trim().length < 3}
            className={`text-sm font-bold px-5 py-2 rounded-xl text-white flex items-center gap-1.5 disabled:opacity-50 ${allowed ? "bg-emerald-600" : "bg-red-600"}`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : allowed ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} {allowed ? "Allow" : "Not allow"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
