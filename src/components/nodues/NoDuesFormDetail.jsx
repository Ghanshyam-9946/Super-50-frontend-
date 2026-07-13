import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, PartyPopper, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

/**
 * Renders one No Dues form's full checklist (subject rows + extra items +
 * remarks), enforcing the same permission rules as the backend:
 *   - a subject row's items can only be ticked by that subject's faculty,
 *     the form's creator (TG), or an admin
 *   - extra items can only be ticked by the form's creator (TG) or an admin
 * Anyone else (including the student) sees a read-only view.
 */
export default function NoDuesFormDetail({ form, currentUser, onChange, onDelete, showDeleteButton }) {
  const [busyKey, setBusyKey] = useState(null);
  const [remark, setRemark] = useState(form.remark || '');
  const [tgRemark, setTgRemark] = useState(form.tgRemark || '');
  const [savingRemarks, setSavingRemarks] = useState(false);

  const uid = currentUser?._id;
  const isAdmin = currentUser?.role === 'admin';
  const isCreator = form.createdBy?._id === uid;
  const canEditRemarks = isCreator || isAdmin;

  const toggleSubjectItem = async (subjectIndex, itemIndex, nextChecked) => {
    const key = `s${subjectIndex}-${itemIndex}`;
    setBusyKey(key);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/subject-item`, {
        subjectIndex,
        itemIndex,
        checked: nextChecked,
      });
      if (data.success) await onChange(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusyKey(null);
    }
  };

  const toggleExtraItem = async (itemIndex, nextChecked) => {
    const key = `e${itemIndex}`;
    setBusyKey(key);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/extra-item`, {
        itemIndex,
        checked: nextChecked,
      });
      if (data.success) await onChange(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusyKey(null);
    }
  };

  const saveRemarks = async () => {
    setSavingRemarks(true);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/remarks`, { remark, tgRemark });
      if (data.success) {
        toast.success('Remarks saved');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save remarks');
    } finally {
      setSavingRemarks(false);
    }
  };

  return (
    <div className="space-y-5">
      {form.isCompleted && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-2xl px-4 py-3 font-bold text-sm">
          <PartyPopper size={18} /> All dues cleared — this form is fully complete.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <InfoBox label="Student" value={form.student?.name} sub={form.student?.enrollmentNumber} />
        <InfoBox label="Session" value={form.session} />
        <InfoBox label="Semester / Section" value={`Sem ${form.semester}${form.section ? ` — ${form.section}` : ''}`} />
        <InfoBox label="Mentor (TG)" value={form.createdBy?.name} />
      </div>

      {/* Subject-wise checklist */}
      <div className="space-y-3">
        {form.subjects.map((subject, si) => {
          const canTickThisRow = isAdmin || isCreator || subject.faculty?._id === uid;
          const allDone = subject.items.every((i) => i.checked);
          return (
            <div
              key={si}
              className={`rounded-2xl border p-4 ${
                allDone ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-[var(--border-light)] glass-card'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    {subject.subjectCode ? `${subject.subjectCode} — ` : ''}{subject.subjectName}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">Faculty: {subject.faculty?.name || '—'}</p>
                </div>
                {allDone && <span className="badge badge-approved">Cleared</span>}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {subject.items.map((item, ii) => {
                  const key = `s${si}-${ii}`;
                  const busy = busyKey === key;
                  return (
                    <button
                      key={ii}
                      disabled={!canTickThisRow || busy}
                      onClick={() => toggleSubjectItem(si, ii, !item.checked)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                        item.checked
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
                          : 'border-[var(--border-light)] text-[var(--text-secondary)]'
                      } ${canTickThisRow ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'cursor-default opacity-80'}`}
                    >
                      {busy ? (
                        <Loader2 size={15} className="animate-spin shrink-0" />
                      ) : item.checked ? (
                        <CheckCircle2 size={15} className="shrink-0" />
                      ) : (
                        <Circle size={15} className="shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* TG-only extra items */}
      <div className="glass-card rounded-2xl p-4">
        <h4 className="font-display font-bold text-sm text-[var(--text-primary)] mb-1">Other Requirements</h4>
        <p className="text-[11px] text-[var(--text-secondary)] font-medium mb-3">
          Ticked only by the mentor (TG) after proof is submitted directly to them.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {form.extraItems.map((item, ii) => {
            const key = `e${ii}`;
            const busy = busyKey === key;
            return (
              <button
                key={ii}
                disabled={!canEditRemarks || busy}
                onClick={() => toggleExtraItem(ii, !item.checked)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                  item.checked
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
                    : 'border-[var(--border-light)] text-[var(--text-secondary)]'
                } ${canEditRemarks ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'cursor-default opacity-80'}`}
              >
                {busy ? (
                  <Loader2 size={15} className="animate-spin shrink-0" />
                ) : item.checked ? (
                  <CheckCircle2 size={15} className="shrink-0" />
                ) : (
                  <Circle size={15} className="shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Remarks */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquare size={15} className="text-[var(--primary)]" /> Remarks
        </h4>
        {canEditRemarks ? (
          <>
            <textarea
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Remark (if any)"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
            />
            <textarea
              rows={2}
              value={tgRemark}
              onChange={(e) => setTgRemark(e.target.value)}
              placeholder="TG Remarks with Sign (HoD)"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
            />
            <button onClick={saveRemarks} disabled={savingRemarks} className="btn-premium text-xs px-4 py-2 flex items-center gap-2">
              {savingRemarks ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />} Save Remarks
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-[var(--text-secondary)]">{form.remark || 'No remark added.'}</p>
            {form.tgRemark && <p className="text-xs text-[var(--text-secondary)] italic">TG: {form.tgRemark}</p>}
          </>
        )}
      </div>

      {showDeleteButton && (isCreator || isAdmin) && (
        <button
          onClick={() => onDelete?.(form._id)}
          className="flex items-center gap-2 text-xs font-bold text-red-500 hover:underline"
        >
          <Trash2 size={13} /> Delete this form
        </button>
      )}
    </div>
  );
}

function InfoBox({ label, value, sub }) {
  return (
    <div className="glass-card rounded-xl p-3">
      <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{label}</div>
      <div className="text-sm font-bold text-[var(--text-primary)] truncate mt-0.5">{value || '—'}</div>
      {sub && <div className="text-[10px] text-[var(--text-secondary)]">{sub}</div>}
    </div>
  );
}
