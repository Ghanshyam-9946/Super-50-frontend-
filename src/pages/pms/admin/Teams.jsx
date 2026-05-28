import { useState, useEffect } from 'react';
import {
  Layers, UserCheck, Filter, AlertTriangle, Info, Edit3, Trash2, FileText, Plus, X,
  Lock, Unlock, Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';

const DOMAIN_OPTS = ['WEB DEVELOPMENT', 'MOBILE APP DEVELOPMENT', 'ML', 'DATA SCIENCE / DATA ANALYTICS', 'IOT', 'OTHER'];
const FE_OPTS = ['HTML-CSS-JAVASCRIPT', 'BOOTSTRAP', 'REACT & ANGULAR', 'FLUTTER ANDROID', 'OTHER'];
const BE_OPTS = ['PYTHON', 'PHP', 'JAVA', 'FLASK FRAMEWORK', 'DJANGO FRAMEWORK', 'FIREBASE', 'ASP.NET', 'OTHER'];
const DB_OPTS = ['MYSQL', 'ORACLE', 'MONGODB', 'OTHER'];
const ROLES = ['Leader', 'Frontend', 'Backend', 'Database', 'Tester', 'Documentation', 'Member'];

// ============= EDIT TEAM MODAL =============
const EditTeamModal = ({ open, onClose, team, onSaved }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    if (team && open) {
      const initMembers = (team.members || []).map((m) => ({
        studentId: m.student?._id || m.student,
        enrollmentNo: m.student?.enrollmentNo || '',
        name: m.student?.name || '',
        role: m.role || 'Member',
      }));

      setForm({
        groupName: team.groupName || '',
        projectTitle: team.projectTitle || '',
        projectDescription: team.projectDescription || '',
        sdgSuggestion: team.sdgSuggestion || '',
        section: team.section || '',
        semester: team.semester || 5,
        projectDomain: team.projectDomain || [],
        frontendTech: team.frontendTech || [],
        backendTech: team.backendTech || [],
        database: team.database || [],
        members: initMembers,
      });
      setPickerQuery('');
      setPickerResults([]);
      setPickerOpen(false);
    }
  }, [team, open]);

  // Debounced search for adding members
  useEffect(() => {
    if (!pickerOpen || !team) return;
    const t = setTimeout(async () => {
      setPickerLoading(true);
      try {
        const res = await adminAPI.searchAvailableStudents({
          q: pickerQuery,
          semester: team.semester,
          excludeTeamId: team._id,
        });
        // Exclude already-added members
        const existingIds = (form.members || []).map((m) => m.studentId);
        setPickerResults(res.data.students.filter((s) => !existingIds.includes(s._id)));
      } catch (err) {
        toast.error(handleError(err));
      } finally {
        setPickerLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pickerQuery, pickerOpen, team, form.members]);

  const addMemberFromPicker = (student) => {
    // Check for duplicate by student ID or enrollment number
    setForm((p) => {
      const exists = p.members.some((m) => m.studentId === student._id || m.enrollmentNo === student.enrollmentNo);
      if (exists) {
        toast.error('Member already added');
        return p;
      }
      if (p.members.length >= 5) {
        toast.error('Max 5 members');
        return p;
      }
      return {
        ...p,
        members: [...p.members, {
          studentId: student._id,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          role: 'Member',
        }],
      };
    });
    // Reset picker state and close picker
    setPickerQuery('');
    setPickerResults([]);
    setPickerOpen(false);
  };

  const removeMember = (idx) => {
    setForm((p) => ({ ...p, members: p.members.filter((_, i) => i !== idx) }));
  };

  const changeRole = (idx, role) => {
    setForm((p) => {
      const ms = p.members.map((m, i) => i === idx ? { ...m, role } : m);
      // If setting Leader, demote others
      if (role === 'Leader') {
        ms.forEach((m, i) => { if (i !== idx && m.role === 'Leader') m.role = 'Member'; });
      }
      return { ...p, members: ms };
    });
  };

  const toggleArray = (key, value) => {
    setForm((p) => {
      const arr = p[key] || [];
      return {
        ...p,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        members: form.members.map((m) => ({
          enrollmentNo: m.enrollmentNo,
          role: m.role,
        })),
      };
      const res = await adminAPI.updateTeam(team._id, payload);
      if (res.data.rejected?.length > 0) {
        toast.error(`Saved, but ${res.data.rejected.length} member(s) rejected (see console)`);
        console.warn('Rejected:', res.data.rejected);
      } else {
        toast.success('Team updated');
      }
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  if (!team) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Team — ${team.groupNo}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : 'Save Changes'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Group Name</label>
            <input className="form-input" value={form.groupName || ''} onChange={(e) => setForm({ ...form, groupName: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Section</label>
            <input className="form-input" value={form.section || ''} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. A" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Project Title</label>
            <input className="form-input" value={form.projectTitle || ''} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Project Description</label>
            <textarea className="form-input" rows="2" value={form.projectDescription || ''} onChange={(e) => setForm({ ...form, projectDescription: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">SDG / Theme</label>
            <input className="form-input" value={form.sdgSuggestion || ''} onChange={(e) => setForm({ ...form, sdgSuggestion: e.target.value })} />
          </div>
        </div>

        {/* Tech checkboxes */}
        <div className="border-t border-slate-100 pt-4">
          <h6 className="font-semibold text-sm mb-3 text-slate-700">Technology Stack (for Initiation Form PDF)</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="form-label">Project Domain</div>
              <div className="space-y-1.5">
                {DOMAIN_OPTS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.projectDomain?.includes(opt) || false}
                      onChange={() => toggleArray('projectDomain', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="form-label">Front-End Technology</div>
              <div className="space-y-1.5">
                {FE_OPTS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.frontendTech?.includes(opt) || false}
                      onChange={() => toggleArray('frontendTech', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="form-label">Back-End + Scripting</div>
              <div className="space-y-1.5">
                {BE_OPTS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.backendTech?.includes(opt) || false}
                      onChange={() => toggleArray('backendTech', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="form-label">Database</div>
              <div className="space-y-1.5">
                {DB_OPTS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.database?.includes(opt) || false}
                      onChange={() => toggleArray('database', opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="border-t border-slate-100 pt-4">
          <h6 className="font-semibold text-sm mb-3 text-slate-700 flex items-center justify-between">
            <span>Team Members ({form.members?.length || 0}/5)</span>
            <span className="text-xs text-slate-500 font-normal">From admin-uploaded students only</span>
          </h6>

          {/* Current members */}
          <div className="space-y-2 mb-3">
            {(form.members || []).length === 0 && (
              <div className="text-sm text-slate-400 italic p-3 bg-slate-50 rounded-lg text-center">
                No members yet. Use the search below to add students.
              </div>
            )}
            {(form.members || []).map((m, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg">
                <div className="col-span-1 text-center text-xs text-slate-500 font-semibold">{idx + 1}</div>
                <div className="col-span-6 min-w-0">
                  <div className="font-semibold text-sm truncate">{m.name || '(unknown)'}</div>
                  <div className="text-xs text-slate-500 font-mono">{m.enrollmentNo}</div>
                </div>
                <select
                  className="form-select col-span-4 py-1.5 text-xs"
                  value={m.role}
                  onChange={(e) => changeRole(idx, e.target.value)}
                >
                  <option value="Leader">Leader</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  className="col-span-1 text-slate-400 hover:text-red-600"
                  title="Remove"
                >
                  <X className="w-4 h-4 mx-auto" />
                </button>
              </div>
            ))}
          </div>

          {/* Picker */}
          {(form.members?.length || 0) < 5 && (
            <div className="relative">
              <label className="form-label">Add member (search admin-uploaded students)</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder={`Search Sem ${team.semester} students by name or enrollment…`}
                  value={pickerQuery}
                  onChange={(e) => { setPickerQuery(e.target.value); setPickerOpen(true); }}
                  onFocus={() => setPickerOpen(true)}
                />
              </div>
              {pickerOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-elevated max-h-72 overflow-y-auto">
                  {pickerLoading ? (
                    <div className="p-3 text-sm text-slate-400 text-center"><Spinner size="sm" /> Searching…</div>
                  ) : pickerResults.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 text-center">
                      {pickerQuery
                        ? `No available Sem ${team.semester} students matching "${pickerQuery}"`
                        : `Type to search students from Sem ${team.semester}`}
                      <div className="text-[10px] mt-1 italic">Only shows admin-uploaded students not in other teams</div>
                    </div>
                  ) : (
                    pickerResults.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => addMemberFromPicker(s)}
                        className="w-full text-left p-3 hover:bg-brand-50 border-b border-slate-100 last:border-0"
                      >
                        <div className="font-semibold text-sm">{s.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{s.enrollmentNo} · Sem {s.semester}</div>
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="block w-full text-center py-2 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
          <p className="form-help mt-2">Students already in other teams are excluded.</p>
        </div>
      </form>
    </Modal>
  );
};

// ============= ASSIGN GUIDE MODAL =============
const AssignGuideModal = ({ open, onClose, team, guides, onSaved }) => {
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (team) setSelectedGuideId(team.guide?._id || '');
  }, [team]);

  const handleSubmit = async () => {
    if (!selectedGuideId) return toast.error('Select a guide');
    setSubmitting(true);
    try {
      await adminAPI.assignGuide(team._id, selectedGuideId);
      toast.success('Guide assigned');
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  if (!team) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Assign Guide — ${team.groupNo}`}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : 'Save Assignment'}
          </button>
        </>
      }
    >
      <div className="text-sm space-y-1 mb-4 p-3 bg-slate-50 rounded-lg">
        <div><strong>Team:</strong> {team.groupName}</div>
        <div><strong>Project:</strong> {team.projectTitle}</div>
        <div><strong>Sem:</strong> {team.semester}th — {team.project?.projectName}</div>
      </div>

      <label className="form-label">Select Guide</label>
      <select className="form-select" value={selectedGuideId} onChange={(e) => setSelectedGuideId(e.target.value)} required>
        <option value="">— Select a guide —</option>
        {guides.map((g) => {
          const eligible = g.academicYear?._id === team.academicYear?._id
            && g.assignedSemester === team.semester;
          return (
            <option key={g._id} value={g._id}>
              {g.name} · {g.email} (Sem {g.assignedSemester}){!eligible && ' — different sem/year'}
            </option>
          );
        })}
      </select>
      <div className="alert-info text-xs mt-3"><Info className="w-4 h-4 flex-shrink-0" /> Both guide and team members will be notified.</div>
    </Modal>
  );
};

// ============= MAIN =============
const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [guides, setGuides] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '' });
  const [loading, setLoading] = useState(true);
  const [editTeam, setEditTeam] = useState(null);
  const [assignTeam, setAssignTeam] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listTeams(filters);
      setTeams(res.data.teams);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  const fetchSupporting = async () => {
    try {
      const [g, y] = await Promise.all([adminAPI.listGuides(), adminAPI.listYears()]);
      setGuides(g.data.guides);
      setYears(y.data.years);
    } catch (err) { toast.error(handleError(err)); }
  };

  useEffect(() => { fetchTeams(); fetchSupporting(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchTeams(); };

  const handleDelete = async (team) => {
    if (!confirmAction(`Delete team "${team.groupNo}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteTeam(team._id);
      toast.success('Team deleted');
      fetchTeams();
    } catch (err) { toast.error(handleError(err)); }
  };

  const handleToggleLock = async (team) => {
    const action = team.isLocked ? 'Unlock' : 'Lock';
    const msg = team.isLocked
      ? `Unlock team "${team.groupNo}"? Students will be able to edit team details again.`
      : `Lock team "${team.groupNo}"? Students will no longer be able to edit team details or change leader. Only admin can unlock.`;
    if (!confirmAction(msg)) return;
    try {
      await adminAPI.toggleTeamLock(team._id);
      toast.success(`Team ${action.toLowerCase()}ed`);
      fetchTeams();
    } catch (err) { toast.error(handleError(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Teams & Guide Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">View all project teams. Admin can edit team details, swap members, assign guides, or delete.</p>
        </div>
        <Link to="/pms/admin/forms" className="btn-outline">
          <FileText className="w-4 h-4" /> Generate PDF Forms
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}>
              <option value="">All years</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th Semester</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full"><Filter className="w-4 h-4" /> Apply Filters</button>
          </div>
        </form>
      </Card>

      <Card title={<>All Teams <span className="badge-secondary ml-1">{teams.length}</span></>} icon={Layers} noPadding>
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : teams.length === 0 ? <EmptyState icon={Layers} title="No teams yet" />
            : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Group</th><th>Project Title</th><th>Sem</th><th>Project</th><th>Members</th><th>Guide</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <div className="font-semibold text-xs flex items-center gap-1.5">
                            {t.groupNo}
                            {t.isLocked && <Lock className="w-3 h-3 text-amber-600" title="Locked" />}
                          </div>
                          <div className="text-xs text-slate-500">{t.groupName}</div>
                        </td>
                        <td>{t.projectTitle}</td>
                        <td><span className="badge-info">{t.semester}th</span></td>
                        <td><span className="badge-primary">{t.project?.projectName}</span></td>
                        <td><span className="badge-secondary">{t.members?.length || 0}</span></td>
                        <td>
                          {t.guide ? (
                            <span className="font-medium text-sm">{t.guide.name}</span>
                          ) : (
                            <span className="badge-warning"><AlertTriangle className="w-3 h-3" /> Unassigned</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditTeam(t)} className="btn-outline btn-sm" title="Edit team">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={() => setAssignTeam(t)} className="btn-secondary btn-sm" title="Assign guide">
                              <UserCheck className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleLock(t)}
                              className={t.isLocked ? 'btn-secondary btn-sm text-amber-600' : 'btn-secondary btn-sm'}
                              title={t.isLocked ? 'Unlock team (allow student edits)' : 'Lock team (prevent student edits)'}
                            >
                              {t.isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            </button>
                            <a
                              href={adminAPI.initiationFormUrl(t._id)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary btn-sm"
                              title="Download initiation form"
                            >
                              <FileText className="w-3 h-3" />
                            </a>
                            <button onClick={() => handleDelete(t)} className="btn-secondary btn-sm text-red-600" title="Delete team">
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

      <EditTeamModal open={!!editTeam} onClose={() => setEditTeam(null)} team={editTeam} onSaved={fetchTeams} />
      <AssignGuideModal open={!!assignTeam} onClose={() => setAssignTeam(null)} team={assignTeam} guides={guides} onSaved={fetchTeams} />
    </div>
  );
};

export default Teams;
