import { useState, useEffect } from 'react';
import { FileText, Filter, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState } from '../../../components/pms/Common';

// Mirrors weeklyReportController.js's getISOWeekInfo exactly — the date
// picker sends this same weekNumber (isoYear*100+isoWeek) so "today" and
// "the week that contains this date" always agree with the backend.
const getISOWeekNumber = (inputDate) => {
  const d = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const isoWeek = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  return d.getUTCFullYear() * 100 + isoWeek;
};

const WeeklyReportCompliance = () => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({ yearId: '', semester: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.listYears().then((res) => setYears(res.data.years)).catch((err) => toast.error(handleError(err)));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const weekNumber = getISOWeekNumber(new Date(date));
      const res = await adminAPI.weeklyReportCompliance({ weekNumber, ...filters });
      setData(res.data);
    } catch (err) {
      toast.error(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchData(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Weekly Report Compliance</h1>
        <p className="text-sm text-slate-500 mt-1">See who has submitted their weekly report for a given week, and who hasn't.</p>
      </div>

      <Card>
        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="form-label">Week Containing</label>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}>
              <option value="">All</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}{y.isActive ? ' (active)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All</option>
              {[5, 6, 7, 8].map((s) => <option key={s} value={s}>{s}th Semester</option>)}
            </select>
          </div>
          <button type="submit" className="btn-outline"><Filter className="w-4 h-4" /> Load</button>
        </form>
      </Card>

      {loading ? (
        <div className="py-10 flex justify-center"><Spinner /></div>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={FileText} title="No teams found for these filters" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card><div className="text-2xl font-bold">{data.total}</div><div className="text-xs text-slate-500">Total Students</div></Card>
            <Card><div className="text-2xl font-bold text-emerald-600">{data.submittedCount}</div><div className="text-xs text-slate-500">Submitted</div></Card>
            <Card><div className="text-2xl font-bold text-red-500">{data.total - data.submittedCount}</div><div className="text-xs text-slate-500">Not Submitted</div></Card>
          </div>

          <Card title={<>Students <span className="badge-secondary ml-1">{data.rows.length}</span></>} icon={FileText} noPadding>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Group</th><th>Student</th><th>Guide(s)</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={`${r.team._id}_${r.student._id}`}>
                      <td className="font-semibold text-xs">{r.team.groupNo}</td>
                      <td>{r.student.name} <span className="text-slate-400 text-xs">({r.student.enrollmentNo})</span></td>
                      <td className="text-sm">{(r.team.guides || []).map((g) => g.name).join(', ') || '—'}</td>
                      <td>
                        {r.submitted ? (
                          <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Submitted</span>
                        ) : (
                          <span className="badge-danger"><XCircle className="w-3 h-3" /> Not Submitted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default WeeklyReportCompliance;
