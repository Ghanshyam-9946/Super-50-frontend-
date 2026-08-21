import { useState, useEffect } from 'react';
import { CheckSquare, ListChecks, Save, AlertTriangle, CalendarX, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, cn } from '../../../utils/pms/helpers';

// Admin/Project-Coordinator equivalent of guide/Attendance.jsx — same daily
// present/late/absent marking flow, but for ANY team (not gated by
// `guide: req.user._id`) and with the presentation selector optional, since
// attendance here is daily, not only on presentation days.
const AttendanceMark = () => {
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '' });
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [marking, setMarking] = useState({
    presentationId: '',
    attendanceDate: new Date().toISOString().slice(0, 10),
    attendance: {},
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminAPI.listYears().then((res) => {
      setYears(res.data.years);
      const active = res.data.years.find((y) => y.isActive);
      if (active) setFilters((f) => ({ ...f, yearId: active._id }));
    }).catch((err) => toast.error(handleError(err)));
  }, []);

  const fetchTeams = async () => {
    if (!filters.yearId || !filters.semester) return;
    try {
      const res = await adminAPI.listTeams({ yearId: filters.yearId, semester: filters.semester });
      setTeams(res.data.teams);
    } catch (err) { toast.error(handleError(err)); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTeams(); }, [filters.yearId, filters.semester]);

  const fetchAttendance = async (id) => {
    if (!id) {
      setTeam(null);
      setMembers([]);
      setPresentations([]);
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const res = await adminAPI.getAttendanceForTeam(id);
      setTeam(res.data.team);
      setMembers(res.data.members || []);
      setPresentations(res.data.presentations || []);
      setRecords(res.data.records || []);

      const initialAtt = {};
      (res.data.members || []).forEach((m) => { initialAtt[m.student._id] = 'present'; });
      setMarking((p) => ({ ...p, attendance: initialAtt }));
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(teamId); }, [teamId]);

  const setStatus = (studentId, status) => {
    setMarking((p) => ({ ...p, attendance: { ...p.attendance, [studentId]: status } }));
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    if (!marking.attendanceDate) return toast.error('Pick a date');
    setSubmitting(true);
    try {
      await adminAPI.markAttendance({
        teamId,
        presentationId: marking.presentationId || null,
        attendanceDate: marking.attendanceDate,
        attendance: marking.attendance,
      });
      toast.success('Attendance saved');
      fetchAttendance(teamId);
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  const statusBtn = (current, target, color, label) => (
    <button
      type="button"
      onClick={() => setStatus(target.studentId, target.value)}
      className={cn(
        'px-3 py-1.5 rounded text-xs font-medium transition-colors border',
        current === target.value
          ? color === 'success' ? 'bg-emerald-600 text-white border-emerald-600'
            : color === 'warning' ? 'bg-amber-500 text-white border-amber-500'
            : 'bg-red-600 text-white border-red-600'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Group-wise and student-wise daily attendance — for any team, not just teams you personally guide.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => { setFilters({ ...filters, yearId: e.target.value }); setTeamId(''); }}>
              <option value="">Select year</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}{y.isActive ? ' (active)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => { setFilters({ ...filters, semester: e.target.value }); setTeamId(''); }}>
              <option value="">Select semester</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th Semester</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchTeams} className="btn-outline w-full"><Filter className="w-4 h-4" /> Load Teams</button>
          </div>
        </div>
      </Card>

      {teams.length > 0 && (
        <Card>
          <label className="form-label">Select Team</label>
          <select className="form-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">— Select a team —</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.groupNo} · {t.groupName} (Sem {t.semester})</option>
            ))}
          </select>
        </Card>
      )}

      {loading && teamId ? (
        <div className="py-20 flex justify-center"><Spinner /></div>
      ) : !teamId ? (
        teams.length > 0 && <Card><EmptyState icon={CheckSquare} title="Select a team above" message="Then mark or view attendance below." /></Card>
      ) : !team ? (
        <Card><EmptyState icon={AlertTriangle} title="Team not found" /></Card>
      ) : (
        <>
          <Card title="Mark Attendance" icon={CheckSquare}>
            <form onSubmit={submitAttendance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Presentation (optional — leave blank for a regular day)</label>
                  <select
                    className="form-select"
                    value={marking.presentationId}
                    onChange={(e) => setMarking({ ...marking, presentationId: e.target.value })}
                  >
                    <option value="">— Not tied to a presentation —</option>
                    {presentations.map((p) => (
                      <option key={p._id} value={p._id}>{p.presentationTitle} ({formatDate(p.presentationDate)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Attendance Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={marking.attendanceDate}
                    onChange={(e) => setMarking({ ...marking, attendanceDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="form-label mb-3">Student Attendance</label>
                <div className="space-y-2">
                  {members.map((m) => {
                    const current = marking.attendance[m.student._id] || 'present';
                    return (
                      <div key={m.student._id} className="flex items-center justify-between flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-sm">{m.student.name}</div>
                          <div className="text-xs text-slate-500">{m.student.enrollmentNo}</div>
                        </div>
                        <div className="flex gap-1">
                          {statusBtn(current, { studentId: m.student._id, value: 'present' }, 'success', 'Present')}
                          {statusBtn(current, { studentId: m.student._id, value: 'late' }, 'warning', 'Late')}
                          {statusBtn(current, { studentId: m.student._id, value: 'absent' }, 'danger', 'Absent')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button disabled={submitting} className="btn-primary">
                {submitting ? <Spinner size="sm" className="text-white" /> : <><Save className="w-4 h-4" /> Save Attendance</>}
              </button>
            </form>
          </Card>

          <Card title={<>Previous Records <span className="badge-secondary ml-1">{records.length}</span></>} icon={ListChecks} noPadding>
            {records.length === 0 ? (
              <EmptyState icon={CalendarX} title="No attendance records yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Student</th><th>Presentation</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td>{formatDate(r.attendanceDate)}</td>
                        <td>
                          <div className="font-semibold">{r.student?.name}</div>
                          <div className="text-xs text-slate-500">{r.student?.enrollmentNo}</div>
                        </td>
                        <td className="text-sm">{r.presentation?.presentationTitle || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceMark;
