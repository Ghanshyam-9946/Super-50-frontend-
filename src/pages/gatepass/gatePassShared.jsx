import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

// One vocabulary for the whole module — the student, the TG, the admin and
// the guard all read the same words for the same state.
export const STATUS_META = {
  pending_tg: { label: 'Waiting for TG', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  pending_admin: { label: 'Waiting for Admin', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  approved: { label: 'Approved — QR active', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  used: { label: 'Approved & Exited', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-600 border-red-500/30' },
  expired: { label: 'Expired', cls: 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)]' },
};

export const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.expired;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

export const fmt = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—';

export const studentLine = (s) =>
  s ? `${s.name}${s.enrollmentNumber || s.enrollmentNo ? ` · ${s.enrollmentNumber || s.enrollmentNo}` : ''}` : 'Unknown student';

export const semLine = (s) =>
  s && (s.semester || s.section || s.department)
    ? [s.department, s.semester ? `Sem ${s.semester}` : '', s.section ? `Sec ${s.section}` : ''].filter(Boolean).join(' · ')
    : '';

// Approve / reject with a remark. Used by both review steps — the TG's and
// the admin's — so the two decisions look and behave identically.
export const ReviewDialog = ({ pass, onClose, onSubmit }) => {
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState('');

  const go = async (decision) => {
    if (decision === 'reject' && !remark.trim()) return;
    setBusy(decision);
    try {
      await onSubmit(decision, remark.trim());
      onClose();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-black text-lg text-[var(--text-primary)]">{studentLine(pass.student)}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{semLine(pass.student)}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        <div className="rounded-2xl bg-[var(--bg-input)] p-4 space-y-2 text-sm">
          <div><span className="text-[var(--text-secondary)]">Reason:</span> <strong className="text-[var(--text-primary)]">{pass.reason}</strong></div>
          <div><span className="text-[var(--text-secondary)]">Exit time:</span> <strong className="text-[var(--text-primary)]">{fmt(pass.exitTime)}</strong></div>
          <div><span className="text-[var(--text-secondary)]">Requested:</span> {fmt(pass.createdAt)}</div>
          {pass.tgDecision?.at && (
            <div className="pt-2 border-t border-[var(--border-light)]">
              <span className="text-[var(--text-secondary)]">TG {pass.tgDecision.by?.name || ''} said:</span>{' '}
              <strong className="text-[var(--text-primary)]">{pass.tgDecision.remark || 'No remark'}</strong>
            </div>
          )}
        </div>

        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Remark
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
            placeholder="Optional when approving, required when rejecting"
            className="mt-1.5 w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          />
        </label>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => go('reject')}
            disabled={!!busy || !remark.trim()}
            title={!remark.trim() ? 'Write a remark to reject' : ''}
            className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-500/40 text-red-600 hover:bg-red-500/10 disabled:opacity-40 flex items-center gap-2"
          >
            {busy === 'reject' && <Loader2 size={14} className="animate-spin" />} Reject
          </button>
          <button onClick={() => go('approve')} disabled={!!busy} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40">
            {busy === 'approve' && <Loader2 size={14} className="animate-spin" />} Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// The row used in every history list.
export const PassRow = ({ pass, showStudent = true, right = null }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
    <div className="min-w-0">
      {showStudent && <div className="font-bold text-sm text-[var(--text-primary)] truncate">{studentLine(pass.student)}</div>}
      <div className="text-sm text-[var(--text-primary)]">{pass.reason}</div>
      <div className="text-xs text-[var(--text-secondary)] mt-1">
        Exit {fmt(pass.exitTime)}
        {pass.usedAt ? ` · scanned ${fmt(pass.usedAt)}${pass.scannedBy?.name ? ` by ${pass.scannedBy.name}` : ''}` : ''}
      </div>
      {(pass.tgDecision?.remark || pass.adminDecision?.remark) && (
        <div className="text-xs text-[var(--text-secondary)] mt-1">
          {pass.tgDecision?.remark ? `TG: ${pass.tgDecision.remark}` : ''}
          {pass.tgDecision?.remark && pass.adminDecision?.remark ? ' · ' : ''}
          {pass.adminDecision?.remark ? `Admin: ${pass.adminDecision.remark}` : ''}
        </div>
      )}
    </div>
    <div className="flex items-center gap-3">
      <StatusBadge status={pass.status} />
      {right}
    </div>
  </div>
);
