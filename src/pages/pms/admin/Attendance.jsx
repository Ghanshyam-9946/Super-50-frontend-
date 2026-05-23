import { useState, useEffect } from 'react';
import { Filter, Download, PieChart, ListChecks, CalendarX } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, downloadCSV } from '../../../utils/pms/helpers';

const AdminAttendance = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [teams, setTeams] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '', teamId: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, tRes, yRes] = await Promise.all([
        adminAPI.attendanceOverview(filters),
        adminAPI.listTeams(),
        adminAPI.listYears(),
      ]);
      setRecords(aRes.data.records);
      setSummary(aRes.data.summary);
      setTeams(tRes.data.teams);
      setYears(yRes.data.years);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchData(); };

  const exportCSV = () => {
    const rows = records.map((r) => ({
      date: formatDate(r.attendanceDate),
      enrollment: r.student?.enrollmentNo,
      student: r.student?.name,
      group: r.team?.groupNo,
      groupName: r.team?.groupName,
      sem: r.team?.semester,
      presentation: r.presentation?.presentationTitle,
      guide: r.guide?.name,
      status: r.status,
    }));
    downloadCSV(rows, ['Date', 'Enrollment', 'Student', 'Group', 'Group Name', 'Sem', 'Presentation', 'Guide', 'Status'], 'attendance.csv');
  };

  const pctColor = (pct) => pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance Overview</h1>
          <p className="text-sm text-slate-500 mt-1">View attendance across all teams.</p>
        </div>
        <button onClick={exportCSV} className="btn-success">
          <Download className="w-4 h-4" /> Download CSV
        </button>
      </div>

      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}>
              <option value="">All</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Team (Optional)</label>
            <select className="form-select" value={filters.teamId} onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}>
              <option value="">All teams</option>
              {teams.map((t) => <option key={t._id} value={t._id}>{t.groupNo} · {t.groupName}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full"><Filter className="w-4 h-4" /> Filter</button>
          </div>
        </form>
      </Card>

      {summary && summary.length > 0 && (
        <Card title="Per-Student Summary for Selected Team" icon={PieChart} noPadding>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th><th>Enrollment</th>
                  <th className="text-center">Present</th><th className="text-center">Late</th><th className="text-center">Absent</th>
                  <th className="text-center">Total</th><th className="text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.student._id}>
                    <td className="font-semibold">{s.student.name}</td>
                    <td className="text-sm text-slate-500">{s.student.enrollmentNo}</td>
                    <td className="text-center"><span className="badge-success">{s.present}</span></td>
                    <td className="text-center"><span className="badge-warning">{s.late}</span></td>
                    <td className="text-center"><span className="badge-danger">{s.absent}</span></td>
                    <td className="text-center">{s.total}</td>
                    <td className="text-center"><span className={pctColor(s.percentage)}>{s.percentage}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title={<>Attendance Records <span className="badge-secondary ml-1">{records.length}</span></>} icon={ListChecks} noPadding>
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : records.length === 0 ? <EmptyState icon={CalendarX} title="No attendance records" message="Try changing the filters above." />
          : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Student</th><th>Group</th><th>Sem</th><th>Presentation</th><th>Marked By</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>{formatDate(r.attendanceDate)}</td>
                      <td>
                        <div className="font-semibold">{r.student?.name}</div>
                        <div className="text-xs text-slate-500">{r.student?.enrollmentNo}</div>
                      </td>
                      <td>
                        <span className="badge-secondary">{r.team?.groupNo}</span>
                        <span className="text-xs text-slate-500 ml-1">{r.team?.groupName}</span>
                      </td>
                      <td><span className="badge-info">{r.team?.semester}th</span></td>
                      <td className="text-sm">{r.presentation?.presentationTitle}</td>
                      <td className="text-sm text-slate-500">{r.guide?.name}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
};

export default AdminAttendance;
