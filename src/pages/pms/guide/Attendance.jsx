import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckSquare, ListChecks, Save, Calendar, AlertTriangle, CalendarX } from 'lucide-react';
import toast from 'react-hot-toast';
import { guideAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, cn } from '../../../utils/pms/helpers';

const GuideAttendance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const teamIdParam = searchParams.get('teamId') || '';

  const [groups, setGroups] = useState([]);
  const [teamId, setTeamId] = useState(teamIdParam);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Marking state
  const [marking, setMarking] = useState({
    presentationId: '',
    attendanceDate: new Date().toISOString().slice(0, 10),
    attendance: {},
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch groups for selector
  useEffect(() => {
    guideAPI.getMyGroups()
      .then((res) => setGroups(res.data.groups))
      .catch((err) => toast.error(handleError(err)));
  }, []);

  // Fetch attendance for selected team
  const fetchAttendance = async (id) => {
    if (!id) {
      setTeam(null);
      setMembers([]);
      setPresentations([]);
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await guideAPI.getAttendance({ teamId: id });
      setTeam(res.data.team);
      setMembers(res.data.members || []);
      setPresentations(res.data.presentations || []);
      setRecords(res.data.records || []);

      // Initialize attendance state
      const initialAtt = {};
      (res.data.members || []).forEach((m) => {
        initialAtt[m.student._id] = 'present';
      });
      setMarking((p) => ({ ...p, attendance: initialAtt }));
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(teamId); /* eslint-disable-next-line */ }, [teamId]);

  const handleTeamChange = (e) => {
    const id = e.target.value;
    setTeamId(id);
    if (id) setSearchParams({ teamId: id });
    else setSearchParams({});
  };

  const setStatus = (studentId, status) => {
    setMarking((p) => ({
      ...p,
      attendance: { ...p.attendance, [studentId]: status },
    }));
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    if (!marking.presentationId) return toast.error('Select presentation');
    if (!marking.attendanceDate) return toast.error('Pick a date');
    setSubmitting(true);
    try {
      await guideAPI.markAttendance({
        teamId,
        presentationId: marking.presentationId,
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
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Select a team to mark or view attendance.</p>
      </div>

      {/* Team selector */}
      <Card>
        <label className="form-label">Select Team</label>
        <select className="form-select" value={teamId} onChange={handleTeamChange}>
          <option value="">— Select a team —</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.groupNo} · {g.groupName} (Sem {g.semester})
            </option>
          ))}
        </select>
      </Card>

      {loading && teamId ? (
        <div className="py-20 flex justify-center"><Spinner /></div>
      ) : !teamId ? (
        <Card><EmptyState icon={CheckSquare} title="Select a team above" message="Then mark or view attendance below." /></Card>
      ) : !team ? (
        <Card><EmptyState icon={AlertTriangle} title="Team not found" /></Card>
      ) : (
        <>
          {/* Mark form */}
          <Card title="Mark Attendance" icon={CheckSquare}>
            {presentations.length === 0 ? (
              <div className="alert-warning text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> No presentations scheduled yet.
              </div>
            ) : (
              <form onSubmit={submitAttendance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Presentation</label>
                    <select
                      className="form-select"
                      value={marking.presentationId}
                      onChange={(e) => setMarking({ ...marking, presentationId: e.target.value })}
                      required
                    >
                      <option value="">Select</option>
                      {presentations.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.presentationTitle} ({formatDate(p.presentationDate)})
                        </option>
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
            )}
          </Card>

          {/* Past records */}
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
                        <td className="text-sm">{r.presentation?.presentationTitle}</td>
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

export default GuideAttendance;
