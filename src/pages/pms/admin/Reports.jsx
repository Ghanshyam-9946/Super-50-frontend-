import { useState, useEffect } from 'react';
import { Filter, Download, Table2, Inbox, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, downloadCSV } from '../../../utils/pms/helpers';

const Reports = () => {
  const [filters, setFilters] = useState({ type: 'attendance', yearId: '', semester: '' });
  const [data, setData] = useState({ rows: [], type: 'attendance' });
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [r, y] = await Promise.all([adminAPI.reports(filters), adminAPI.listYears()]);
      setData(r.data);
      setYears(y.data.years);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchReports(); };

  const exportCSV = () => {
    if (data.type === 'attendance') {
      const rows = data.rows.map((r) => ({
        date: formatDate(r.attendanceDate),
        enrollment: r.student?.enrollmentNo,
        student: r.student?.name,
        group: r.team?.groupNo,
        presentation: r.presentation?.presentationTitle,
        status: r.status,
      }));
      downloadCSV(rows, ['Date', 'Enrollment', 'Student', 'Group', 'Presentation', 'Status'], 'attendance_report.csv');
    } else {
      const rows = data.rows.map((r) => ({
        group: r.team?.groupNo,
        groupName: r.team?.groupName,
        sem: r.team?.semester,
        presentation: r.presentation?.presentationTitle,
        status: r.status,
        marks: r.marksObtained ?? '',
        locked: r.isLocked ? 'Yes' : 'No',
        guide: r.team?.guide?.name || '',
      }));
      downloadCSV(rows, ['Group', 'Group Name', 'Sem', 'Presentation', 'Status', 'Marks', 'Locked', 'Guide'], 'presentation_status.csv');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Filter and export attendance or presentation status data.</p>
        </div>
        <button onClick={exportCSV} className="btn-success">
          <Download className="w-4 h-4" /> Download CSV
        </button>
      </div>

      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Report Type</label>
            <select className="form-select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="attendance">Attendance</option>
              <option value="presentation">Presentation Status</option>
            </select>
          </div>
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
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full"><Filter className="w-4 h-4" /> Apply</button>
          </div>
        </form>
      </Card>

      <Card
        title={<>{data.type === 'attendance' ? 'Attendance' : 'Presentation Status'} Records <span className="badge-secondary ml-1">{data.rows?.length || 0}</span></>}
        icon={Table2}
        noPadding
      >
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : !data.rows || data.rows.length === 0 ? <EmptyState icon={Inbox} title="No records found" message="Try changing the filters above." />
          : data.type === 'attendance' ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Enrollment</th><th>Student</th><th>Group</th><th>Presentation</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r._id}>
                      <td>{formatDate(r.attendanceDate)}</td>
                      <td className="font-semibold">{r.student?.enrollmentNo}</td>
                      <td>{r.student?.name}</td>
                      <td><span className="badge-secondary">{r.team?.groupNo}</span></td>
                      <td className="text-sm">{r.presentation?.presentationTitle}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Group</th><th>Sem</th><th>Presentation</th><th>Status</th><th>Marks</th><th>Locked</th><th>Guide</th></tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="font-semibold">{r.team?.groupNo}</div>
                        <div className="text-xs text-slate-500">{r.team?.groupName}</div>
                      </td>
                      <td><span className="badge-info">{r.team?.semester}th</span></td>
                      <td>{r.presentation?.presentationTitle}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{r.marksObtained ?? '—'}</td>
                      <td>
                        {r.isLocked ? <span className="badge-secondary"><Lock className="w-3 h-3" /> Locked</span> : '—'}
                      </td>
                      <td className="text-sm">{r.team?.guide?.name || '—'}</td>
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

export default Reports;
