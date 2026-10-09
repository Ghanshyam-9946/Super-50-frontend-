import { useState, useEffect } from 'react';
import { Filter, Download, Table2, Inbox, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, downloadCSV } from '../../../utils/pms/helpers';

const Reports = () => {
  const [filters, setFilters] = useState({
    type: 'attendance', yearId: '', semester: '', projectId: '', teamId: '', from: '', to: '',
  });
  const [data, setData] = useState({ rows: [], type: 'attendance' });
  const [years, setYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMarks = filters.type === 'presentation-marks' || filters.type === 'meeting-marks';

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [r, y] = await Promise.all([adminAPI.reports(filters), adminAPI.listYears()]);
      setData(r.data);
      setYears(y.data.years);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  // The lists the project and group pickers need. Loaded once; a failure
  // here only costs the two extra filters, so the page still works.
  const fetchPickers = async () => {
    try {
      const [p, t] = await Promise.all([
        adminAPI.listProjects?.() ?? Promise.resolve({ data: {} }),
        adminAPI.listTeams?.({ limit: 500 }) ?? Promise.resolve({ data: {} }),
      ]);
      setProjects(p.data?.projects || p.data?.data || []);
      setTeams(t.data?.teams || t.data?.data || []);
    } catch { /* the filters simply stay empty */ }
  };

  useEffect(() => { fetchReports(); fetchPickers(); /* eslint-disable-next-line */ }, []);

  const apply = (e) => { e.preventDefault(); fetchReports(); };

  const exportCSV = () => {
    if (data.type === 'presentation-marks') {
      const rows = data.rows.map((r) => ({
        heldOn: r.heldOn ? formatDate(r.heldOn) : '',
        group: r.groupNo, groupName: r.groupName, sem: r.semester, project: r.project,
        presentation: r.presentation,
        marks: r.marks ?? '', outOf: r.outOf ?? '',
        panel: r.panelMember, guides: r.guides, feedback: r.feedback,
      }));
      return downloadCSV(rows,
        ['Date', 'Group', 'Group Name', 'Sem', 'Project', 'Presentation', 'Marks', 'Out Of', 'Panel Member', 'Guides', 'Feedback'],
        'presentation_marks.csv');
    }
    if (data.type === 'meeting-marks') {
      const rows = data.rows.map((r) => ({
        metOn: r.metOn ? formatDate(r.metOn) : '',
        group: r.groupNo, groupName: r.groupName, sem: r.semester, project: r.project,
        meeting: r.meeting,
        marks: r.varies ? 'varies by student' : (r.marks ?? ''), outOf: r.outOf ?? '',
        guide: r.guide, students: r.students,
      }));
      return downloadCSV(rows,
        ['Date', 'Group', 'Group Name', 'Sem', 'Project', 'Meeting', 'Marks', 'Out Of', 'Guide', 'Students'],
        'guide_meeting_marks.csv');
    }
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
        guide: (r.team?.guides || []).map((g) => g.name).join(', ') || '',
      }));
      downloadCSV(rows, ['Group', 'Group Name', 'Sem', 'Presentation', 'Status', 'Marks', 'Locked', 'Guide'], 'presentation_status.csv');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Attendance, presentation status, presentation marks and guide meeting marks \u2014
            by project, by group and by date.
          </p>
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
              <option value="presentation-marks">Presentation Marks</option>
              <option value="meeting-marks">Guide Meeting Marks</option>
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
          {/* Project, group and dates: the three ways a coordinator
              actually narrows a marks report. */}
          <div>
            <label className="form-label">Project</label>
            <select className="form-select" value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value, teamId: '' })}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title || p.projectName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Group</label>
            <select className="form-select" value={filters.teamId}
              onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}>
              <option value="">All groups</option>
              {teams
                .filter((t) => !filters.projectId || String(t.project?._id || t.project) === filters.projectId)
                .map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.groupNo}{t.groupName ? ` \u2014 ${t.groupName}` : ''}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full"><Filter className="w-4 h-4" /> Apply</button>
          </div>
          {isMarks && (filters.from || filters.to) && (
            <p className="sm:col-span-4 text-xs text-slate-500">
              Dates match the day the {filters.type === 'meeting-marks' ? 'meeting was held' : 'presentation was held'},
              not the day the marks were entered. Records saved before that date was
              recorded will not appear in a dated search.
            </p>
          )}
        </form>
      </Card>

      <Card
        title={<>{{
          attendance: 'Attendance',
          presentation: 'Presentation Status',
          'presentation-marks': 'Presentation Marks',
          'meeting-marks': 'Guide Meeting Marks',
        }[data.type] || 'Report'} Records <span className="badge-secondary ml-1">{data.rows?.length || 0}</span></>}
        icon={Table2}
        noPadding
      >
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : !data.rows || data.rows.length === 0 ? <EmptyState icon={Inbox} title="No records found" message="Try changing the filters above." />
          : data.type === 'presentation-marks' ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Group</th><th>Project</th><th>Presentation</th><th>Marks</th><th>Panel member</th><th>Feedback</th></tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r._id}>
                      <td className="whitespace-nowrap">{r.heldOn ? formatDate(r.heldOn) : <span className="text-slate-400">not recorded</span>}</td>
                      <td>
                        <div className="font-semibold">{r.groupNo}</div>
                        <div className="text-xs text-slate-500">{r.groupName}</div>
                      </td>
                      <td className="text-sm">{r.project || '\u2014'}</td>
                      <td className="text-sm">{r.presentation}</td>
                      <td className="font-semibold whitespace-nowrap">
                        {r.marks ?? '\u2014'}{r.outOf != null ? <span className="text-xs text-slate-500"> / {r.outOf}</span> : null}
                      </td>
                      <td className="text-sm">{r.panelMember || '\u2014'}</td>
                      <td className="text-xs text-slate-500 max-w-[220px] truncate" title={r.feedback}>{r.feedback || '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data.type === 'meeting-marks' ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Group</th><th>Project</th><th>Meeting</th><th>Marks</th><th>Guide</th><th>Students</th></tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r._id}>
                      <td className="whitespace-nowrap">{r.metOn ? formatDate(r.metOn) : <span className="text-slate-400">not recorded</span>}</td>
                      <td>
                        <div className="font-semibold">{r.groupNo}</div>
                        <div className="text-xs text-slate-500">{r.groupName}</div>
                      </td>
                      <td className="text-sm">{r.project || '\u2014'}</td>
                      <td className="text-sm">{r.meeting}</td>
                      <td className="font-semibold whitespace-nowrap">
                        {/* Older records were given per student, so they can
                            disagree. Saying so beats printing one of them. */}
                        {r.varies
                          ? <span className="text-xs text-amber-600">varies by student</span>
                          : <>{r.marks ?? '\u2014'}{r.outOf != null ? <span className="text-xs text-slate-500"> / {r.outOf}</span> : null}</>}
                      </td>
                      <td className="text-sm">{r.guide || '\u2014'}</td>
                      <td className="text-sm">{r.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data.type === 'attendance' ? (
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
                      <td className="text-sm">{(r.team?.guides || []).map((g) => g.name).join(', ') || '—'}</td>
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
