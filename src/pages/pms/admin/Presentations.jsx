import { useState, useEffect } from 'react';
import { CalendarPlus, Presentation, Trash2, Info, Pencil, X, Plus, CalendarCheck, ClipboardEdit } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';
import { downloadFile } from '../../../utils/downloadFile';

const blankForm = {
  academicYear: '', semester: '', presentationTitle: '',
  presentationNo: '1', presentationDates: [''], totalMarks: '25', criteria: '',
  kind: 'presentation', guides: [], teams: [],
};

// Default marks per round: three presentations of 25 and documentation of 25.
const DEFAULT_MARKS = { presentation: '25', documentation: '25' };

// Multi-select list of guides or groups for the panel.
const PickList = ({ items, selected, onToggle, empty, render }) => (
  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
    {items.length === 0 ? (
      <p className="text-xs text-slate-400 px-3 py-2">{empty}</p>
    ) : (
      items.map((it) => (
        <label key={it._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
          <input type="checkbox" checked={selected.includes(it._id)} onChange={() => onToggle(it._id)} />
          <span className="min-w-0">{render(it)}</span>
        </label>
      ))
    )}
  </div>
);

const Presentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [scheduleFor, setScheduleFor] = useState(null); // presentation object or null
  const [teamSchedule, setTeamSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingTeamId, setSavingTeamId] = useState(null);
  const [downloadingEvalsId, setDownloadingEvalsId] = useState(null);
  const [allGuides, setAllGuides] = useState([]);
  const [allTeams, setAllTeams] = useState([]);

  const selectedYear = years.find((y) => y._id === form.academicYear);
  const dateMin = selectedYear?.startDate ? selectedYear.startDate.slice(0, 10) : undefined;
  const dateMax = selectedYear?.endDate ? selectedYear.endDate.slice(0, 10) : undefined;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, yRes, gRes, tRes] = await Promise.all([
        adminAPI.listPresentations(),
        adminAPI.listYears(),
        adminAPI.listGuides(),
        adminAPI.listTeams(),
      ]);
      setPresentations(pRes.data.presentations);
      setYears(yRes.data.years);
      setAllGuides(gRes.data.guides || []);
      setAllTeams(tRes.data.teams || []);
      const active = yRes.data.years.find((y) => y.isActive);
      if (active && !form.academicYear) {
        setForm((f) => ({ ...f, academicYear: active._id }));
      }
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      kind: p.kind || 'presentation',
      guides: (p.guides || []).map((g) => g._id || g),
      teams: (p.teams || []).map((t) => t._id || t),
      academicYear: p.academicYear?._id || '',
      semester: String(p.semester),
      presentationTitle: p.presentationTitle,
      presentationNo: String(p.presentationNo),
      presentationDates: (p.presentationDates || []).map((d) => d?.slice(0, 10)).filter(Boolean).length
        ? p.presentationDates.map((d) => d.slice(0, 10))
        : [''],
      totalMarks: String(p.totalMarks),
      criteria: p.criteria || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const setDateAt = (idx, value) => {
    setForm((f) => {
      const next = [...f.presentationDates];
      next[idx] = value;
      return { ...f, presentationDates: next };
    });
  };

  const addDateRow = () => setForm((f) => ({ ...f, presentationDates: [...f.presentationDates, ''] }));

  const removeDateRow = (idx) => setForm((f) => ({
    ...f,
    presentationDates: f.presentationDates.length > 1 ? f.presentationDates.filter((_, i) => i !== idx) : f.presentationDates,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanDates = form.presentationDates.filter(Boolean);
    if (cleanDates.length === 0) {
      toast.error('At least one date is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, presentationDates: cleanDates };
      if (editingId) {
        await adminAPI.updatePresentation(editingId, payload);
        toast.success('Presentation updated');
        setEditingId(null);
        setForm(blankForm);
      } else {
        await adminAPI.createPresentation(payload);
        toast.success('Presentation scheduled');
        setForm({ ...form, presentationTitle: '', presentationDates: [''], criteria: '', guides: [], teams: [] });
      }
      fetchData();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirmAction('Delete this presentation?')) return;
    try {
      await adminAPI.deletePresentation(id);
      toast.success('Deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  const openSchedule = async (p) => {
    setScheduleFor(p);
    setScheduleLoading(true);
    try {
      const res = await adminAPI.getPresentationSchedule(p._id);
      setTeamSchedule(res.data.teamSchedule);
    } catch (err) {
      toast.error(handleError(err));
      setScheduleFor(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const assignDate = async (teamId, assignedDate) => {
    if (!assignedDate) return;
    setSavingTeamId(teamId);
    try {
      await adminAPI.assignPresentationDate(scheduleFor._id, { teamId, assignedDate });
      setTeamSchedule((prev) => prev.map((t) => (t.teamId === teamId ? { ...t, assignedDate } : t)));
      toast.success('Date assigned');
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSavingTeamId(null);
    }
  };

  const downloadEvaluations = async (p) => {
    setDownloadingEvalsId(p._id);
    try {
      await downloadFile(adminAPI.evaluationsPdfUrl(p._id), `evaluations_${p.presentationTitle.replace(/[/\s]/g, '_')}.pdf`);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setDownloadingEvalsId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Presentations</h1>
        <p className="text-sm text-slate-500 mt-1">Project type is auto-resolved from semester. Add multiple candidate dates, then assign one to each group.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Card title={editingId ? 'Edit Presentation' : 'New Presentation'} icon={editingId ? Pencil : CalendarPlus}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Academic Year</label>
                <select className="form-select" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required>
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y._id} value={y._id}>{y.yearName}{y.isActive ? ' (active)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Semester</label>
                <select className="form-select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required>
                  <option value="">Select semester</option>
                  <option value="5">5th — Minor-1</option>
                  <option value="6">6th — Minor-2</option>
                  <option value="7">7th — Major-1</option>
                  <option value="8">8th — Major-2</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="Presentation-1" value={form.presentationTitle} onChange={(e) => setForm({ ...form, presentationTitle: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">No.</label>
                  <select className="form-select" value={form.presentationNo} onChange={(e) => setForm({ ...form, presentationNo: e.target.value })} required>
                    <option>1</option><option>2</option><option>3</option><option>4</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Round Type</label>
                <select
                  className="form-select"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value, totalMarks: DEFAULT_MARKS[e.target.value] })}
                >
                  <option value="presentation">Presentation (25 marks)</option>
                  <option value="documentation">Documentation (25 marks)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Candidate Date(s)</label>
                <div className="space-y-2">
                  {form.presentationDates.map((d, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="date"
                        className="form-input flex-1"
                        value={d}
                        onChange={(e) => setDateAt(idx, e.target.value)}
                        min={dateMin}
                        max={dateMax}
                        required
                      />
                      <button type="button" onClick={() => removeDateRow(idx)} disabled={form.presentationDates.length === 1} className="btn-outline btn-sm disabled:opacity-30">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addDateRow} className="btn-outline btn-sm mt-2">
                  <Plus className="w-3 h-3" /> Add another date
                </button>
                {selectedYear && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Must fall within {selectedYear.yearName} ({formatDate(selectedYear.startDate)} – {formatDate(selectedYear.endDate)})
                  </p>
                )}
                {form.presentationDates.filter(Boolean).length > 1 && (
                  <p className="text-[11px] text-brand-600 mt-1">
                    Multiple dates — after saving, use "Assign Dates" to give each group its own date.
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">Total Marks (per student)</label>
                <input type="number" min="1" className="form-input" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">Panel — guides who will mark this ({form.guides.length})</label>
                <PickList
                  items={allGuides}
                  selected={form.guides}
                  onToggle={(id) => setForm((f) => ({ ...f, guides: f.guides.includes(id) ? f.guides.filter((x) => x !== id) : [...f.guides, id] }))}
                  empty="No guides tagged yet."
                  render={(g) => <>{g.name} <span className="text-xs text-slate-500">· Sem {[].concat(g.assignedSemester ?? []).join(', ') || '—'}</span></>}
                />
                <p className="form-help">Only these guides can give marks for this round. Leave empty to allow every guide of that semester.</p>
              </div>
              <div>
                <label className="form-label">Groups in this round ({form.teams.length})</label>
                <PickList
                  items={form.semester ? allTeams.filter((t) => String(t.semester) === String(form.semester)) : allTeams}
                  selected={form.teams}
                  onToggle={(id) => setForm((f) => ({ ...f, teams: f.teams.includes(id) ? f.teams.filter((x) => x !== id) : [...f.teams, id] }))}
                  empty="No teams for this semester yet."
                  render={(t) => <>{t.groupNo} <span className="text-xs text-slate-500">· {t.groupName}</span></>}
                />
                <p className="form-help">Leave empty to include every group of that semester.</p>
              </div>
              <div>
                <label className="form-label">Criteria</label>
                <textarea className="form-input" rows="2" value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} />
              </div>
              <div className="alert-info text-xs"><Info className="w-4 h-4 flex-shrink-0" /> Project type auto-mapped from semester.</div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Spinner size="sm" className="text-white" /> : editingId ? 'Update' : 'Schedule'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="All Scheduled Presentations" icon={Presentation} noPadding>
            {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
              : presentations.length === 0 ? <EmptyState icon={Presentation} title="Nothing scheduled yet" />
              : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Title</th><th>Year</th><th>Sem</th><th>Project</th><th>Date(s)</th><th>Marks</th><th className="text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {presentations.map((p) => (
                        <tr key={p._id}>
                          <td className="font-semibold">{p.presentationTitle}</td>
                          <td>{p.academicYear?.yearName}</td>
                          <td><span className="badge-info">{p.semester}th</span></td>
                          <td><span className="badge-primary">{p.project?.projectName}</span></td>
                          <td>
                            {p.presentationDates?.length > 1
                              ? <span className="badge-warning">{p.presentationDates.length} dates</span>
                              : formatDate(p.presentationDates?.[0])}
                          </td>
                          <td>{p.totalMarks}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openSchedule(p)} className="btn-outline btn-sm" title="Assign dates to groups">
                                <CalendarCheck className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => downloadEvaluations(p)}
                                disabled={downloadingEvalsId === p._id}
                                className="btn-outline btn-sm"
                                title="Download all groups' evaluation PDFs for this round"
                              >
                                {downloadingEvalsId === p._id ? <Spinner size="sm" /> : <ClipboardEdit className="w-3 h-3" />}
                              </button>
                              <button onClick={() => startEdit(p)} className="btn-outline btn-sm">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(p._id)} className="btn-secondary btn-sm">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>
        </div>
      </div>

      <Modal open={!!scheduleFor} onClose={() => setScheduleFor(null)} title={scheduleFor ? `Assign Dates — ${scheduleFor.presentationTitle}` : ''} size="lg">
        {scheduleLoading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : teamSchedule.length === 0 ? (
          <EmptyState icon={Presentation} title="No groups found for this year/semester" />
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">
              Pick one of this presentation's candidate dates for each group. Students will only see their own group's date.
            </p>
            {teamSchedule.map((t) => (
              <div key={t.teamId} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{t.groupName}</div>
                  <div className="text-xs text-slate-500">{t.groupNo}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {savingTeamId === t.teamId && <Spinner size="sm" />}
                  <select
                    className="form-select text-sm py-1"
                    value={t.assignedDate ? t.assignedDate.slice(0, 10) : ''}
                    onChange={(e) => assignDate(t.teamId, e.target.value)}
                    disabled={savingTeamId === t.teamId}
                  >
                    <option value="">— Not assigned —</option>
                    {(scheduleFor?.presentationDates || []).map((d) => (
                      <option key={d} value={d.slice(0, 10)}>{formatDate(d)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Presentations;
