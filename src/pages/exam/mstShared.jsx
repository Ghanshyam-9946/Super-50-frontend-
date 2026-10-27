import { X } from "lucide-react";
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
