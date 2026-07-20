import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, Loader2, PartyPopper, MessageSquare, Trash2, Percent, Save, Wallet, CalendarHeart, Plus, X, ArrowRightCircle, Undo2, Settings2, ChevronDown, Search, UserCog, Repeat, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DEFAULT_EXTRA_ATTENDANCE_CATEGORIES = ['Event/Farewell', 'SAC', 'Sports'];
const ADD_NEW_CATEGORY_VALUE = '__add_new__';
const DEFAULT_SUBJECT_ITEMS = ['Assignment', 'Tutorial', 'POD AI Quiz', 'Presentation/GD/Task/Mini Project', 'RGPV'];
// RGPV is only applicable — and tickable — below this base attendance %
// (must match ATTENDANCE_RULES.otherRgpvQp.maxBaseAttendance on the backend).
const RGPV_ATTENDANCE_THRESHOLD = 60;

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
  const [manageOpen, setManageOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get(`/no-dues/${form._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `No-Dues-${(form.student?.name || 'student').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download the PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const uid = currentUser?._id;
  // Subjects render as an accordion — only the viewer's own subject(s) start
  // expanded, everything else stays collapsed (still clickable to open).
  const [openSubjects, setOpenSubjects] = useState(
    () => new Set(form.subjects.map((s, i) => (s.faculty?._id === uid ? i : null)).filter((i) => i !== null))
  );
  const toggleSubjectOpen = (si) =>
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(si)) next.delete(si);
      else next.add(si);
      return next;
    });

  const isAdmin = currentUser?.role === 'admin';
  const isCreator = form.createdBy?._id === uid;
  const canEditRemarks = isCreator || isAdmin;
  // The student's TG (mentor) — and only them (or admin) — manages every
  // attendance boost on this form: Medical/Other RGPV QP/Certification AND
  // the free-form Extra Attendance entries. Neither the coordinator nor a
  // subject faculty has this access unless they're also this student's TG.
  const isTG = form.student?.mentor?._id === uid;
  const canEditTGAttendance = isAdmin || isTG;
  // Dues fees: the coordinator who released the form, admin, or the
  // student's own TG (mentor) can update it.
  const canEditDuesFees = canEditRemarks || isTG;

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

  // Categories dropdown = the 3 common defaults + any custom category
  // already used on this form (so a newly-typed one becomes reusable).
  const categoryOptions = useMemo(() => {
    const used = (form.extraAttendanceEntries || []).map((e) => e.category).filter(Boolean);
    return [...new Set([...DEFAULT_EXTRA_ATTENDANCE_CATEGORIES, ...used])];
  }, [form.extraAttendanceEntries]);

  const [extraCategory, setExtraCategory] = useState(DEFAULT_EXTRA_ATTENDANCE_CATEGORIES[0]);
  const [newCategoryDraft, setNewCategoryDraft] = useState('');
  const [extraDescription, setExtraDescription] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [addingExtra, setAddingExtra] = useState(false);
  const [removingEntryId, setRemovingEntryId] = useState(null);
  const [forwarding, setForwarding] = useState(false);
  const [forwardPromptOpen, setForwardPromptOpen] = useState(false);
  const [forwardRemarkDraft, setForwardRemarkDraft] = useState('');

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
    const isNewCategory = extraCategory === ADD_NEW_CATEGORY_VALUE;
    const category = (isNewCategory ? newCategoryDraft : extraCategory).trim();
    if (!category) return toast.error('Enter a category name');
    const hours = Number(extraHours);
    if (!hours || hours <= 0) return toast.error('Enter hours claimed');
    setAddingExtra(true);
    try {
      const { data } = await api.post(`/no-dues/${form._id}/extra-attendance`, {
        category,
        description: extraDescription.trim(),
        hoursClaimed: hours,
      });
      if (data.success) {
        toast.success('Extra Attendance entry added');
        if (isNewCategory) {
          setExtraCategory(category);
          setNewCategoryDraft('');
        }
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

  const toggleForward = async (nextForwarded, forwardRemark) => {
    setForwarding(true);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/forward`, {
        forwarded: nextForwarded,
        ...(forwardRemark !== undefined ? { forwardRemark } : {}),
      });
      if (data.success) {
        toast.success(data.message || 'Updated');
        setForwardPromptOpen(false);
        setForwardRemarkDraft('');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update forward status');
    } finally {
      setForwarding(false);
    }
  };

  const duesFeesDue = form.student?.duesFees > 0;

  const clickMarkForward = () => {
    if (duesFeesDue) {
      setForwardPromptOpen(true);
    } else {
      toggleForward(true);
    }
  };

  const confirmForwardWithRemark = () => {
    if (!forwardRemarkDraft.trim()) return toast.error('A remark is required — this student still has dues fees pending');
    toggleForward(true, forwardRemarkDraft.trim());
  };

  const toggleSubjectItem = async (subjectIndex, itemIndex, nextChecked, hoursClaimed) => {
    const key = `s${subjectIndex}-${itemIndex}`;
    setBusyKey(key);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/subject-item`, {
        subjectIndex,
        itemIndex,
        checked: nextChecked,
        ...(hoursClaimed !== undefined ? { hoursClaimed } : {}),
      });
      if (data.success) await onChange(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusyKey(null);
    }
  };

  // RGPV item needs 0-12 hours claimed before it can be ticked — this
  // tracks which item's inline hours prompt is currently open.
  const [rgpvPromptKey, setRgpvPromptKey] = useState(null);
  const [rgpvHoursDraft, setRgpvHoursDraft] = useState('');
  const confirmRgpvTick = async (si, ii) => {
    const hours = Number(rgpvHoursDraft);
    if (rgpvHoursDraft === '' || Number.isNaN(hours) || hours < 0 || hours > 12) {
      return toast.error('Enter hours between 0 and 12');
    }
    setRgpvPromptKey(null);
    await toggleSubjectItem(si, ii, true, hours);
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
        <div className="bg-purple-500/10 border border-purple-500/25 text-[var(--primary)] rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2 font-bold text-sm">
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
          {form.forwardRemark && (
            <p className="text-xs font-medium mt-2 opacity-90">Dues fees remark: {form.forwardRemark}</p>
          )}
        </div>
      ) : (
        (isCreator || isAdmin) && (
          <div className="space-y-2">
            <button
              onClick={clickMarkForward}
              disabled={!form.isCompleted || forwarding}
              title={!form.isCompleted ? 'Complete every subject and extra item first' : ''}
              className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 disabled:opacity-40"
            >
              {forwarding ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightCircle size={15} />} Mark Forward
            </button>
            {forwardPromptOpen && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 space-y-2">
                <p className="text-xs font-bold text-amber-600">
                  This student still has ₹{form.student?.duesFees} in dues fees — a remark is required to forward anyway.
                </p>
                <textarea
                  rows={2}
                  value={forwardRemarkDraft}
                  onChange={(e) => setForwardRemarkDraft(e.target.value)}
                  placeholder="Why forward despite pending dues fees?"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setForwardPromptOpen(false); setForwardRemarkDraft(''); }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmForwardWithRemark}
                    disabled={forwarding}
                    className="btn-premium text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    {forwarding ? <Loader2 size={13} className="animate-spin" /> : <ArrowRightCircle size={13} />} Confirm Forward
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      <div className="flex justify-end">
        <button
          onClick={downloadPdf}
          disabled={downloadingPdf}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all disabled:opacity-40"
        >
          {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download PDF
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <InfoBox label="Student" value={form.student?.name} sub={form.student?.enrollmentNumber} />
        <InfoBox label="Batch" value={form.batch} />
        <InfoBox label="Semester / Section" value={`Sem ${form.semester}${form.section ? ` — ${form.section}` : ''}`} />
        <InfoBox label="TG (Mentor)" value={form.student?.mentor?.name} sub={form.createdBy?.name ? `Released by ${form.createdBy.name}` : ''} />
      </div>

      {/* Manage form — edit details / reassign student / reassign TG */}
      {(isCreator || isAdmin) && (
        <div className="glass-card rounded-2xl p-4">
          <button
            onClick={() => setManageOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 text-sm font-bold text-[var(--text-primary)]"
          >
            <span className="flex items-center gap-2">
              <Settings2 size={15} className="text-[var(--primary)]" /> Manage Form
            </span>
            <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${manageOpen ? 'rotate-180' : ''}`} />
          </button>
          {manageOpen && (
            <div className="mt-4 pt-4 border-t border-[var(--border-light)] space-y-5">
              <ReassignStudentPanel form={form} onChange={onChange} />
              <ReassignMentorPanel form={form} onChange={onChange} />
              <EditFormDetailsPanel form={form} onChange={onChange} />
            </div>
          )}
        </div>
      )}

      {/* Attendance + upgrade criteria */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Percent size={15} className="text-[var(--primary)]" /> Attendance
          </h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--text-secondary)]">Base: <strong className="text-[var(--text-primary)]">{attendanceSummary.baseAttendancePercentage}%</strong></span>
            {/* "Adjusted" = just the Medical/Other RGPV QP/Certification boost
                amount — 0% until one of those is enabled, growing from there.
                Extra Attendance is already folded into Base, so it never
                shows up here. */}
            <span className="text-[var(--text-secondary)]">Adjusted: <strong className="text-emerald-500">+{attendanceSummary.totalBoostPercent}%</strong></span>
            <span className="text-[var(--text-secondary)]">Final: <strong className="text-emerald-500">{attendanceSummary.adjustedAttendancePercentage}%</strong></span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <AttendanceCriterionBox
            label="Medical"
            hint="Up to 60 hrs → up to +10%. Needs base ≥ 50%."
            eligible={attendanceSummary.baseAttendancePercentage >= 50}
            editable={canEditTGAttendance}
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
            hint="Up to 40 hrs → up to +6.67%. Needs base < 60%."
            eligible={attendanceSummary.baseAttendancePercentage < 60}
            editable={canEditTGAttendance}
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
            editable={canEditTGAttendance}
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

        {canEditTGAttendance && (
          <button onClick={saveAttendanceCriteria} disabled={savingAttendance} className="btn-premium text-xs px-4 py-2 flex items-center gap-2">
            {savingAttendance ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Attendance Criteria
          </button>
        )}
      </div>

      {/* Extra Attendance — logged only by this student's TG (mentor) */}
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
          Logged only by this student's TG (mentor) — Event/Farewell, SAC, or Sports participation, converted to
          attendance % (same ratio as Medical, no cap). Unlike Medical/Other RGPV QP/Certification,
          this is added directly to the student's real attendance record — not just this form.
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
                {canEditTGAttendance && (
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

        {canEditTGAttendance && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[var(--border-light)]">
            <select
              value={extraCategory}
              onChange={(e) => setExtraCategory(e.target.value)}
              className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={ADD_NEW_CATEGORY_VALUE}>+ Add new category…</option>
            </select>
            {extraCategory === ADD_NEW_CATEGORY_VALUE && (
              <input
                value={newCategoryDraft}
                onChange={(e) => setNewCategoryDraft(e.target.value)}
                placeholder="New category name"
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
            )}
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
          {canEditDuesFees ? (
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

      {/* Subject-wise checklist — accordion; only the viewer's own subject
          starts expanded, everything else stays collapsed until clicked. */}
      <div className="space-y-3">
        {form.subjects.map((subject, si) => {
          const canTickThisRow = isAdmin || isCreator || subject.faculty?._id === uid;
          const rgpvApplicable = attendanceSummary.baseAttendancePercentage < RGPV_ATTENDANCE_THRESHOLD;
          const isItemApplicable = (item) => item.label !== 'RGPV' || rgpvApplicable;
          const allDone = subject.items.every((i) => i.checked || i.optional || !isItemApplicable(i));
          const isOpen = openSubjects.has(si);
          return (
            <div
              key={si}
              className={`rounded-2xl border overflow-hidden ${
                allDone ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-[var(--border-light)] glass-card'
              }`}
            >
              <button
                onClick={() => toggleSubjectOpen(si)}
                className="w-full flex items-center justify-between gap-2 flex-wrap p-4 text-left"
              >
                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    {subject.subjectCode ? `${subject.subjectCode} — ` : ''}{subject.subjectName}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">Faculty: {subject.faculty?.name || '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {allDone && <span className="badge badge-approved">Cleared</span>}
                  <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isOpen && (
                <div className="grid sm:grid-cols-2 gap-2 px-4 pb-4">
                  {subject.items.map((item, ii) => {
                    const key = `s${si}-${ii}`;
                    const busy = busyKey === key;
                    const applicable = isItemApplicable(item);
                    const tickable = canTickThisRow && applicable;
                    const isRgpv = item.label === 'RGPV';

                    if (isRgpv && !item.checked && rgpvPromptKey === key) {
                      return (
                        <div
                          key={ii}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--primary)]/30 bg-[var(--bg-input)] text-xs"
                        >
                          <span className="text-[var(--text-secondary)] shrink-0 font-semibold">RGPV hrs (0-12):</span>
                          <input
                            type="number"
                            min={0}
                            max={12}
                            value={rgpvHoursDraft}
                            onChange={(e) => setRgpvHoursDraft(e.target.value)}
                            autoFocus
                            className="w-14 bg-transparent outline-none border-b border-[var(--border-light)] text-[var(--text-primary)]"
                          />
                          <button
                            onClick={() => confirmRgpvTick(si, ii)}
                            disabled={busy}
                            className="text-emerald-500 font-bold shrink-0 ml-auto"
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          </button>
                          <button
                            onClick={() => setRgpvPromptKey(null)}
                            className="text-[var(--text-secondary)] shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={ii}
                        disabled={!tickable || busy}
                        onClick={() => {
                          if (isRgpv && !item.checked) {
                            setRgpvHoursDraft('');
                            setRgpvPromptKey(key);
                          } else {
                            toggleSubjectItem(si, ii, !item.checked);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                          !applicable
                            ? 'border-[var(--border-light)] text-[var(--text-secondary)] opacity-50'
                            : item.checked
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
                            : 'border-[var(--border-light)] text-[var(--text-secondary)]'
                        } ${tickable ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'cursor-default opacity-80'}`}
                      >
                        {busy ? (
                          <Loader2 size={15} className="animate-spin shrink-0" />
                        ) : item.checked ? (
                          <CheckCircle2 size={15} className="shrink-0" />
                        ) : (
                          <Circle size={15} className="shrink-0" />
                        )}
                        <span className="truncate">
                          {item.label}
                          {isRgpv && item.checked && (
                            <span className="text-[var(--text-secondary)] font-normal"> ({item.hoursClaimed} hrs, +{item.boostPercent}%)</span>
                          )}
                          {item.optional && <span className="text-[var(--text-secondary)] font-normal"> (optional)</span>}
                          {!applicable && (
                            <span className="text-[var(--text-secondary)] font-normal"> (N/A — attendance ≥ {RGPV_ATTENDANCE_THRESHOLD}%)</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
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

// Fixes a form that was created for the wrong person — searches all students
// and, on pick, moves this entire form (checklist, ticks, everything) over.
export function ReassignStudentPanel({ form, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/no-dues/all-students', { params: { search: search.trim() } });
        if (data.success) setResults(data.data.filter((s) => s._id !== form.student?._id));
      } catch {
        /* silent — search is best-effort */
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, form.student?._id]);

  const reassign = async (student) => {
    if (!window.confirm(`Reassign this form from ${form.student?.name} to ${student.name}?`)) return;
    setReassigning(true);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/reassign-student`, { studentId: student._id });
      if (data.success) {
        toast.success(data.message || 'Student reassigned');
        setSearch('');
        setResults([]);
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign student');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1.5">
        <Repeat size={13} /> Reassign Student
      </h5>
      <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
        <Search size={13} className="text-[var(--text-secondary)] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a different student by name or enrollment…"
          className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)]"
        />
        {searching && <Loader2 size={13} className="animate-spin text-[var(--text-secondary)]" />}
      </div>
      {results.length > 0 && (
        <div className="border border-[var(--border-light)] rounded-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
          {results.map((s) => (
            <button
              key={s._id}
              onClick={() => reassign(s)}
              disabled={reassigning}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] border-b border-[var(--border-light)] last:border-0 disabled:opacity-40"
            >
              <span className="font-bold text-[var(--text-primary)]">{s.name}</span>
              <span className="text-[var(--text-secondary)]">{s.enrollmentNumber}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Changes which TG (mentor) this student reports to — affects who can
// manage their attendance boosts and who they show up under in "Assign Faculty".
export function ReassignMentorPanel({ form, onChange }) {
  const [facultyList, setFacultyList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mentorId, setMentorId] = useState(form.student?.mentor?._id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/no-dues/faculty-list').then(({ data }) => {
      if (data.success) setFacultyList(data.data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/no-dues/${form._id}/reassign-mentor`, { mentorId: mentorId || null });
      if (data.success) {
        toast.success(data.message || 'TG reassigned');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign TG');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1.5">
        <UserCog size={13} /> Reassign TG (Mentor)
      </h5>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={mentorId}
          onChange={(e) => setMentorId(e.target.value)}
          disabled={!loaded}
          className="flex-1 bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        >
          <option value="">No TG</option>
          {facultyList.map((f) => (
            <option key={f._id} value={f._id}>{f.name} ({f.role})</option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={saving || mentorId === (form.student?.mentor?._id || '')}
          className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 justify-center shrink-0 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
        </button>
      </div>
    </div>
  );
}

// Edits batch/semester/section and the subjects list itself — add/remove
// subjects, rename them, or add custom tasks under a subject. Ticks/faculty
// on a subject are preserved as long as its name doesn't change.
export function EditFormDetailsPanel({ form, onChange }) {
  const [batch, setBatch] = useState(form.batch || '');
  const [semester, setSemester] = useState(form.semester || 1);
  const [section, setSection] = useState(form.section || '');
  const [subjects, setSubjects] = useState(
    form.subjects.map((s) => ({ subjectCode: s.subjectCode || '', subjectName: s.subjectName, items: s.items.map((i) => i.label) }))
  );
  const [customItemDraft, setCustomItemDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const setSubject = (idx, patch) => {
    const next = [...subjects];
    next[idx] = { ...next[idx], ...patch };
    setSubjects(next);
  };
  const addSubject = () => setSubjects([...subjects, { subjectCode: '', subjectName: '', items: [...DEFAULT_SUBJECT_ITEMS] }]);
  const removeSubject = (idx) => setSubjects(subjects.filter((_, i) => i !== idx));
  const toggleItem = (idx, item) => {
    const current = subjects[idx].items;
    setSubject(idx, { items: current.includes(item) ? current.filter((i) => i !== item) : [...current, item] });
  };
  const addCustomItem = (idx) => {
    const label = (customItemDraft[idx] || '').trim();
    if (!label || subjects[idx].items.includes(label)) return;
    setSubject(idx, { items: [...subjects[idx].items, label] });
    setCustomItemDraft((prev) => ({ ...prev, [idx]: '' }));
  };

  const save = async () => {
    if (!batch.trim()) return toast.error('Batch is required');
    if (subjects.some((s) => !s.subjectName.trim())) return toast.error('Every subject needs a name');
    setSaving(true);
    try {
      const { data } = await api.put(`/no-dues/${form._id}`, {
        batch: batch.trim(),
        semester,
        section: section.trim(),
        subjects: subjects.map((s) => ({ subjectCode: s.subjectCode.trim(), subjectName: s.subjectName.trim(), items: s.items })),
      });
      if (data.success) {
        toast.success(data.message || 'Form updated');
        await onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Edit Form Details</h5>
      <div className="grid sm:grid-cols-3 gap-2">
        <input
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          placeholder="Batch (2023-27)"
          className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        />
        <select
          value={semester}
          onChange={(e) => setSemester(Number(e.target.value))}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <input
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="Section (optional)"
          className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--text-secondary)]">Subjects</span>
          <button onClick={addSubject} className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
            <Plus size={12} /> Add Subject
          </button>
        </div>
        {subjects.map((subj, idx) => (
          <div key={idx} className="border border-[var(--border-light)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={subj.subjectCode}
                onChange={(e) => setSubject(idx, { subjectCode: e.target.value })}
                placeholder="Code"
                className="w-24 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              <input
                value={subj.subjectName}
                onChange={(e) => setSubject(idx, { subjectName: e.target.value })}
                placeholder="Subject name"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              {subjects.length > 1 && (
                <button onClick={() => removeSubject(idx)} className="text-[var(--text-secondary)] hover:text-red-500 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...DEFAULT_SUBJECT_ITEMS, 'Lab Record', ...subj.items])].map((item) => {
                const on = subj.items.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(idx, item)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                      on ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' : 'border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {on ? '✓ ' : '+ '}{item}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={customItemDraft[idx] || ''}
                onChange={(e) => setCustomItemDraft((prev) => ({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem(idx); } }}
                placeholder="Add a custom task…"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] outline-none"
              />
              <button onClick={() => addCustomItem(idx)} className="text-[11px] font-bold text-[var(--primary)] hover:underline shrink-0">
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="btn-premium text-xs px-4 py-2 flex items-center gap-2">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
      </button>
    </div>
  );
}
