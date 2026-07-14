import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, PartyPopper, MessageSquare, Trash2, Percent, Save, Wallet, CalendarHeart, Plus, X, ArrowRightCircle, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EXTRA_ATTENDANCE_CATEGORIES = ['Event/Farewell', 'SAC', 'Sports'];

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
  // Only the Academic Coordinator who released this form (or admin) manages
  // the attendance-upgrade criteria — same gate as remarks/extra items.
  const canEditAttendance = canEditRemarks;
  // Any subject faculty assigned to this form ("TG/Faculty") — logs
  // Extra Attendance entries for this student, alongside ticking their row.
  const isAssignedFaculty = form.subjects.some((s) => s.faculty?._id === uid);
  const canEditExtraAttendance = isAdmin || isAssignedFaculty;

  const upgrade = form.attendanceUpgrade || {};
  const attendanceSummary = form.attendanceSummary || {
    baseAttendancePercentage: 0,
    totalBoostPercent: 0,
    adjustedAttendancePercentage: 0,
  };

  const [medicalEnabled, setMedicalEnabled] = useState(upgrade.medical?.enabled || false);
  const [medicalHours, setMedicalHours] = useState(upgrade.medical?.hoursClaimed || 0);
  const [rgpvEnabled, setRgpvEnabled] = useState(upgrade.otherRgpvQp?.enabled || false);
  const [rgpvHours, setRgpvHours] = useState(upgrade.otherRgpvQp?.hoursClaimed || 0);
  const [certEnabled, setCertEnabled] = useState(upgrade.certification?.enabled || false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [duesFees, setDuesFees] = useState(form.student?.duesFees ?? 0);
  const [savingDuesFees, setSavingDuesFees] = useState(false);

  const [extraCategory, setExtraCategory] = useState(EXTRA_ATTENDANCE_CATEGORIES[0]);
  const [extraDescription, setExtraDescription] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [addingExtra, setAddingExtra] = useState(false);
  const [removingEntryId, setRemovingEntryId] = useState(null);
  const [forwarding, setForwarding] = useState(false);

  const saveDuesFees = async () => {
    setSavingDuesFees(true);
    try {
      const { data } = await api.patch(`/no-dues/students/${form.student._id}/dues-fees`, { duesFees });
      if (data.success) {
        toast.success('Dues fees updated');
        await onChange({ ...form, student: { ...form.student, duesFees: data.data.duesFees } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update dues fees');
    } finally {
      setSavingDuesFees(false);
    }
  };

  const saveAttendanceCriteria = async () => {
    setSavingAttendance(true);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/attendance-criteria`, {
        medical: { enabled: medicalEnabled, hoursClaimed: medicalHours },
        otherRgpvQp: { enabled: rgpvEnabled, hoursClaimed: rgpvHours },
        certification: { enabled: certEnabled },
      });
      if (data.success) {
        toast.success('Attendance criteria saved');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance criteria');
    } finally {
      setSavingAttendance(false);
    }
  };

  const addExtraEntry = async () => {
    const hours = Number(extraHours);
    if (!hours || hours <= 0) return toast.error('Enter hours claimed');
    setAddingExtra(true);
    try {
      const { data } = await api.post(`/no-dues/${form._id}/extra-attendance`, {
        category: extraCategory,
        description: extraDescription.trim(),
        hoursClaimed: hours,
      });
      if (data.success) {
        toast.success('Extra Attendance entry added');
        setExtraDescription('');
        setExtraHours('');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add entry');
    } finally {
      setAddingExtra(false);
    }
  };

  const removeExtraEntry = async (entryId) => {
    setRemovingEntryId(entryId);
    try {
      const { data } = await api.delete(`/no-dues/${form._id}/extra-attendance/${entryId}`);
      if (data.success) {
        toast.success('Entry removed');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove entry');
    } finally {
      setRemovingEntryId(null);
    }
  };

  const toggleForward = async (nextForwarded) => {
    setForwarding(true);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/forward`, { forwarded: nextForwarded });
      if (data.success) {
        toast.success(data.message || 'Updated');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update forward status');
    } finally {
      setForwarding(false);
    }
  };

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

      {form.forwarded ? (
        <div className="flex items-center justify-between flex-wrap gap-2 bg-purple-500/10 border border-purple-500/25 text-[var(--primary)] rounded-2xl px-4 py-3 font-bold text-sm">
          <span className="flex items-center gap-2">
            <ArrowRightCircle size={18} /> Forwarded for exam eligibility
            {form.forwardedAt ? ` on ${new Date(form.forwardedAt).toLocaleDateString()}` : ''}
          </span>
          {(isCreator || isAdmin) && (
            <button
              onClick={() => toggleForward(false)}
              disabled={forwarding}
              className="flex items-center gap-1.5 text-xs font-bold hover:underline"
            >
              {forwarding ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />} Undo
            </button>
          )}
        </div>
      ) : (
        (isCreator || isAdmin) && (
          <button
            onClick={() => toggleForward(true)}
            disabled={!form.isCompleted || forwarding}
            title={!form.isCompleted ? 'Complete every subject and extra item first' : ''}
            className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 disabled:opacity-40"
          >
            {forwarding ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightCircle size={15} />} Mark Forward
          </button>
        )
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <InfoBox label="Student" value={form.student?.name} sub={form.student?.enrollmentNumber} />
        <InfoBox label="Batch" value={form.batch} />
        <InfoBox label="Semester / Section" value={`Sem ${form.semester}${form.section ? ` — ${form.section}` : ''}`} />
        <InfoBox label="Mentor (TG)" value={form.createdBy?.name} />
      </div>

      {/* Attendance + upgrade criteria */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Percent size={15} className="text-[var(--primary)]" /> Attendance
          </h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--text-secondary)]">Base: <strong className="text-[var(--text-primary)]">{attendanceSummary.baseAttendancePercentage}%</strong></span>
            {attendanceSummary.totalBoostPercent > 0 && (
              <span className="text-emerald-500 font-bold">+{attendanceSummary.totalBoostPercent}%</span>
            )}
            <span className="text-[var(--text-secondary)]">Adjusted: <strong className="text-emerald-500">{attendanceSummary.adjustedAttendancePercentage}%</strong></span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <AttendanceCriterionBox
            label="Medical"
            hint="Up to 60 hrs → up to +10%. Needs base ≥ 50%."
            eligible={attendanceSummary.baseAttendancePercentage >= 50}
            editable={canEditAttendance}
            enabled={medicalEnabled}
            onToggle={setMedicalEnabled}
            hours={medicalHours}
            onHoursChange={setMedicalHours}
            maxHours={60}
            boostPercent={upgrade.medical?.boostPercent || 0}
            showHours
          />
          <AttendanceCriterionBox
            label="Other RGPV QP"
            hint="Up to 40 hrs → up to +6.67%. Needs base > 60%."
            eligible={attendanceSummary.baseAttendancePercentage > 60}
            editable={canEditAttendance}
            enabled={rgpvEnabled}
            onToggle={setRgpvEnabled}
            hours={rgpvHours}
            onHoursChange={setRgpvHours}
            maxHours={40}
            boostPercent={upgrade.otherRgpvQp?.boostPercent || 0}
            showHours
          />
          <AttendanceCriterionBox
            label="Certification"
            hint="2% per approved certificate, max 3 (6%). Needs base ≥ 50%."
            eligible={attendanceSummary.baseAttendancePercentage >= 50}
            editable={canEditAttendance}
            enabled={certEnabled}
            onToggle={setCertEnabled}
            boostPercent={upgrade.certification?.boostPercent || 0}
            extraNote={
              upgrade.certification?.certificatesCounted
                ? `${upgrade.certification.certificatesCounted} certificate(s) counted`
                : 'Auto-counted from the student\'s approved certificates'
            }
          />
        </div>

        {canEditAttendance && (
          <button onClick={saveAttendanceCriteria} disabled={savingAttendance} className="btn-premium text-xs px-4 py-2 flex items-center gap-2">
            {savingAttendance ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Attendance Criteria
          </button>
        )}
      </div>

      {/* Extra Attendance — logged by the assigned subject faculty */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <CalendarHeart size={15} className="text-[var(--primary)]" /> Extra Attendance
          </h4>
          {attendanceSummary.extraAttendanceBoostPercent > 0 && (
            <span className="text-[11px] font-bold text-emerald-500">+{attendanceSummary.extraAttendanceBoostPercent}%</span>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] font-medium">
          Logged by the subject faculty assigned to this form — Event/Farewell, SAC, or Sports participation, converted to
          attendance % (same ratio as Medical, capped at +10% total).
        </p>

        {form.extraAttendanceEntries.length === 0 ? (
          <p className="text-xs italic text-[var(--text-secondary)]">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {form.extraAttendanceEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-[var(--text-primary)]">{entry.category}</span>
                  {entry.description && <span className="text-[var(--text-secondary)]"> — {entry.description}</span>}
                  <span className="text-[var(--text-secondary)]"> · {entry.hoursClaimed} hrs · +{entry.boostPercent}% · by {entry.addedBy?.name || '—'}</span>
                </div>
                {canEditExtraAttendance && (
                  <button
                    onClick={() => removeExtraEntry(entry._id)}
                    disabled={removingEntryId === entry._id}
                    className="text-[var(--text-secondary)] hover:text-red-500 shrink-0"
                  >
                    {removingEntryId === entry._id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canEditExtraAttendance && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[var(--border-light)]">
            <select
              value={extraCategory}
              onChange={(e) => setExtraCategory(e.target.value)}
              className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
            >
              {EXTRA_ATTENDANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={extraDescription}
              onChange={(e) => setExtraDescription(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
            />
            <input
              type="number"
              min={0}
              value={extraHours}
              onChange={(e) => setExtraHours(e.target.value)}
              placeholder="Hours"
              className="w-24 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
            />
            <button
              onClick={addExtraEntry}
              disabled={addingExtra}
              className="btn-premium text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
            >
              {addingExtra ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
            </button>
          </div>
        )}
      </div>

      {/* Dues fees */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Wallet size={15} className="text-[var(--primary)]" /> Dues Fees
          </h4>
          {canEditAttendance ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">₹</span>
              <input
                type="number"
                min={0}
                value={duesFees}
                onChange={(e) => setDuesFees(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              <button onClick={saveDuesFees} disabled={savingDuesFees} className="btn-premium text-xs px-3 py-1.5 flex items-center gap-1.5">
                {savingDuesFees ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
            </div>
          ) : (
            <span className="text-sm font-bold text-[var(--text-primary)]">₹{form.student?.duesFees ?? 0}</span>
          )}
        </div>
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

function AttendanceCriterionBox({
  label, hint, eligible, editable, enabled, onToggle, hours, onHoursChange, maxHours, boostPercent, showHours, extraNote,
}) {
  const disabled = !editable || !eligible;
  return (
    <div className={`rounded-xl border p-3 space-y-2 ${enabled ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-[var(--border-light)]'}`}>
      <div className="flex items-center justify-between gap-2">
        <label className={`flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={enabled}
            disabled={disabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-3.5 h-3.5 accent-[var(--primary)]"
          />
          {label}
        </label>
        {boostPercent > 0 && <span className="text-[11px] font-bold text-emerald-500 shrink-0">+{boostPercent}%</span>}
      </div>
      <p className="text-[10px] text-[var(--text-secondary)] leading-snug">{hint}</p>
      {!eligible && <p className="text-[10px] text-amber-500 font-semibold">Not eligible at current attendance</p>}
      {showHours && editable && eligible && (
        <input
          type="number"
          min={0}
          max={maxHours}
          value={hours}
          onChange={(e) => onHoursChange(Math.min(maxHours, Math.max(0, Number(e.target.value) || 0)))}
          placeholder={`Hours claimed (max ${maxHours})`}
          className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
        />
      )}
      {showHours && !editable && enabled && (
        <p className="text-[10px] text-[var(--text-secondary)]">{hours} hrs claimed</p>
      )}
      {extraNote && <p className="text-[10px] text-[var(--text-secondary)] italic">{extraNote}</p>}
    </div>
  );
}
