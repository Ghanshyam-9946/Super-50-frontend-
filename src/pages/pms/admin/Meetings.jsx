import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Pencil, Trash2, Users, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, StatCard, confirmAction } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

// The coordinator schedules three guide-meeting rounds per year+semester.
// Each has a date window students must meet their guide inside, and a
// marks ceiling (15 / 15 / 20 by default) that the guide marks out of.
const DEFAULT_MAX = { 1: 15, 2: 15, 3: 20 };
const MEETING_NOS = [1, 2, 3];
const SEMESTERS = [5, 6, 7, 8];
const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const blankForm = (meetingNo = 1) => ({
  meetingNo,
  title: '',
  startDate: '',
  endDate: '',
  maxMarks: DEFAULT_MAX[meetingNo],
  instructions: '',
});

const MeetingForm = ({ open, onClose, initial, years, defaults, onSaved }) => {
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const setNo = (no) => setForm((f) => ({ ...f, meetingNo: no, maxMarks: f.touchedMarks ? f.maxMarks : DEFAULT_MAX[no] }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        academicYear: form.academicYear,
        semester: Number(form.semester),
        meetingNo: Number(form.meetingNo),
        title: form.title,
        startDate: form.startDate,
        endDate: form.endDate,
        maxMarks: Number(form.maxMarks),
        instructions: form.instructions,
      };
      const { data } = form._id ? await adminAPI.updateMeeting(form._id, payload) : await adminAPI.saveMeeting(payload);
      toast.success(form._id ? 'Meeting updated' : 'Meeting scheduled');
      onSaved(data.meeting);
      onClose();
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form._id ? `Edit ${form.title || `Meeting ${form.meetingNo}`}` : 'Schedule a Meeting'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner size="sm" className="text-white" /> : 'Save'}
          </button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Academic Year *</label>
            <select className="form-select" value={form.academicYear || ''} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required disabled={!!form._id}>
              <option value="">Select</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester *</label>
            <select className="form-select" value={form.semester || ''} onChange={(e) => setForm({ ...form, semester: e.target.value })} required disabled={!!form._id}>
              <option value="">Select</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}th</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Meeting *</label>
            <select className="form-select" value={form.meetingNo} onChange={(e) => setNo(Number(e.target.value))} disabled={!!form._id}>
              {MEETING_NOS.map((n) => <option key={n} value={n}>Meeting {n} (default {defaults?.[n] ?? DEFAULT_MAX[n]} marks)</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Maximum Marks *</label>
            <input
              type="number" min="1" max="100" className="form-input"
              value={form.maxMarks}
              onChange={(e) => setForm({ ...form, maxMarks: e.target.value, touchedMarks: true })}
              required
            />
            <p className="form-help">The guide marks each student out of this.</p>
          </div>
          <div>
            <label className="form-label">From *</label>
            <input type="date" className="form-input" value={dateInput(form.startDate)} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">To *</label>
            <input type="date" className="form-input" value={dateInput(form.endDate)} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Title (optional)</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={`Meeting ${form.meetingNo}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Instructions for students (optional)</label>
            <textarea className="form-input" rows="2" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Bring your SRS draft and module plan" />
          </div>
        </div>
      </form>
    </Modal>
  );
};

const StatusModal = ({ meetingId, onClose }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!meetingId) return;
    adminAPI.getMeetingStatus(meetingId)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(handleError(err)));
  }, [meetingId]);

  const done = (data?.rows || []).flatMap((r) => r.students).filter((s) => s.done).length;
  const total = (data?.rows || []).flatMap((r) => r.students).length;

  return (
    <Modal open={!!meetingId} onClose={onClose} title={data ? `${data.meeting.title || `Meeting ${data.meeting.meetingNo}`} — status` : 'Loading…'} size="xl">
      {!data ? (
        <div className="py-10 flex justify-center"><Spinner /></div>
      ) : data.rows.length === 0 ? (
        <EmptyState icon={Users} title="No teams in this year/semester yet" />
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-slate-600">{done} of {total} students evaluated · max {data.meeting.maxMarks} marks</div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Group</th><th>Guide</th><th>Student</th><th>Marks</th><th>Remark</th></tr></thead>
              <tbody>
                {data.rows.flatMap((r) => r.students.map((st, i) => (
                  <tr key={`${r.team._id}-${st.student?._id || i}`}>
                    {i === 0 ? <td rowSpan={r.students.length} className="align-top font-semibold">{r.team.groupNo}<div className="text-xs text-slate-500">{r.team.groupName}</div></td> : null}
                    {i === 0 ? <td rowSpan={r.students.length} className="align-top text-sm">{(r.team.guides || []).map((g) => g.name).join(', ') || '—'}</td> : null}
                    <td>{st.student?.name}<div className="text-xs text-slate-500 font-mono">{st.student?.enrollmentNo}</div></td>
                    <td>{st.done ? <span className="badge-success">{st.marks}/{data.meeting.maxMarks}</span> : <span className="badge-secondary">Pending</span>}</td>
                    <td className="text-sm text-slate-600">{st.remark || '—'}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

const AdminMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [progress, setProgress] = useState([]);
  const [defaults, setDefaults] = useState(DEFAULT_MAX);
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(blankForm());
  const [statusId, setStatusId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, yRes] = await Promise.all([
        adminAPI.listMeetings({ ...(yearId && { academicYear: yearId }), ...(semester && { semester }) }),
        adminAPI.listYears(),
      ]);
      setMeetings(mRes.data.meetings);
      setProgress(mRes.data.progress || []);
      setDefaults(mRes.data.defaults || DEFAULT_MAX);
      setYears(yRes.data.years);
      if (!yearId) {
        const active = yRes.data.years.find((y) => y.isActive);
        if (active) setYearId(active._id);
      }
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [yearId, semester]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    const used = meetings.filter((m) => String(m.academicYear?._id || m.academicYear) === yearId && String(m.semester) === String(semester)).map((m) => m.meetingNo);
    const next = MEETING_NOS.find((n) => !used.includes(n)) || 1;
    setFormInitial({ ...blankForm(next), academicYear: yearId, semester });
    setFormOpen(true);
  };

  const openEdit = (m) => {
    setFormInitial({
      _id: m._id,
      academicYear: m.academicYear?._id || m.academicYear,
      semester: m.semester,
      meetingNo: m.meetingNo,
      title: m.title || '',
      startDate: m.startDate,
      endDate: m.endDate,
      maxMarks: m.maxMarks,
      instructions: m.instructions || '',
      touchedMarks: true,
    });
    setFormOpen(true);
  };

  const remove = async (m) => {
    if (!confirmAction(`Delete ${m.title || `Meeting ${m.meetingNo}`}? Marks already recorded in it are deleted too.`)) return;
    try {
      await adminAPI.deleteMeeting(m._id);
      toast.success('Meeting deleted');
      load();
    } catch (err) {
      const msg = handleError(err);
      if (/already recorded/i.test(msg) && confirmAction(`${msg}\n\nDelete anyway?`)) {
        try {
          await adminAPI.deleteMeeting(m._id, true);
          toast.success('Meeting deleted');
          load();
        } catch (e2) { toast.error(handleError(e2)); }
      } else {
        toast.error(msg);
      }
    }
  };

  const progressOf = (id) => progress.find((p) => String(p.meeting) === String(id)) || { students: 0, evaluated: 0, teams: 0 };
  const totalMarks = meetings
    .filter((m) => (!semester || String(m.semester) === String(semester)) && (!yearId || String(m.academicYear?._id || m.academicYear) === yearId))
    .reduce((sum, m) => sum + m.maxMarks, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Guide Meetings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule Meeting 1, 2 and 3 with a date range each. Students see the dates on their dashboard; their guide records marks and remarks inside that window.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary" disabled={!yearId || !semester}>
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[200px]">
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={yearId} onChange={(e) => setYearId(e.target.value)}>
              <option value="">All years</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="form-label">Semester</label>
            <select className="form-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}th</option>)}
            </select>
          </div>
          {!semester && <p className="text-xs text-slate-500 pb-2">Pick a semester to schedule a new meeting.</p>}
        </div>
      </Card>

      {!loading && meetings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Rounds scheduled" value={meetings.length} icon={CalendarClock} color="primary" />
          <StatCard label="Total meeting marks" value={totalMarks} icon={CheckCircle2} color="success" meta="Distributed across the rubric criteria" />
        </div>
      )}

      <Card title="Scheduled Meetings" icon={CalendarClock} noPadding>
        {loading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : meetings.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No meetings scheduled yet" message="Schedule Meeting 1, 2 and 3 for this year and semester." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Meeting</th><th>Year / Sem</th><th>Window</th><th>Max Marks</th><th>Evaluated</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {meetings.map((m) => {
                  const pr = progressOf(m._id);
                  return (
                    <tr key={m._id}>
                      <td>
                        <div className="font-semibold">{m.title || `Meeting ${m.meetingNo}`}</div>
                        {m.instructions && <div className="text-xs text-slate-500 max-w-xs truncate">{m.instructions}</div>}
                      </td>
                      <td className="text-sm">{m.academicYear?.yearName} · Sem {m.semester}</td>
                      <td className="text-sm whitespace-nowrap">{formatDate(m.startDate)} – {formatDate(m.endDate)}</td>
                      <td><span className="badge-primary">{m.maxMarks}</span></td>
                      <td>
                        <button onClick={() => setStatusId(m._id)} className="badge-info hover:underline">
                          {pr.evaluated}/{pr.students} students
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setStatusId(m._id)} title="View status" className="btn-outline btn-sm"><Users className="w-3 h-3" /></button>
                          <button onClick={() => openEdit(m)} title="Edit" className="btn-outline btn-sm"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => remove(m)} title="Delete" className="btn-secondary btn-sm"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <MeetingForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={formInitial}
        years={years}
        defaults={defaults}
        onSaved={load}
      />
      {statusId && <StatusModal meetingId={statusId} onClose={() => setStatusId(null)} />}
    </div>
  );
};

export default AdminMeetings;
