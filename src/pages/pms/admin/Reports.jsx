import { useState, useEffect } from 'react';
import { Filter, Download, Table2, Inbox, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatusBadge } from '../../../components/pms/Common';
import { formatDate, downloadCSV } from '../../../utils/pms/helpers';

// PMS reports. Several can be on screen at once — a coordinator comparing
// attendance against marks had to keep switching one dropdown and lose the
// other, so the type is a set of chips and each chosen one gets its own
// table under the shared filters.

const TYPES = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'presentation', label: 'Presentation Status' },
  { key: 'presentation-marks', label: 'Presentation Marks' },
  { key: 'meeting-marks', label: 'Guide Meeting Marks' },
];

const LABEL = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));
const DASH = '—';

const Reports = () => {
  const [filters, setFilters] = useState({
    yearId: '', semester: '', projectId: '', teamId: '', from: '', to: '',
  });
  // Which reports to show. More than one is the point.
  const [types, setTypes] = useState(['attendance']);
  // { [type]: rows }
  const [results, setResults] = useState({});
  const [years, setYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const marksShown = types.some((t) => t === 'presentation-marks' || t === 'meeting-marks');

  const fetchReports = async (which = types) => {
    if (!which.length) { setResults({}); return; }
    setLoading(true);
    try {
      // One request per report — the API answers for a single type, and
      // asking in parallel keeps this as quick as the slowest one.
      const [answers, y] = await Promise.all([
        Promise.all(which.map((type) => adminAPI.reports({ ...filters, type }))),
        adminAPI.listYears(),
      ]);
      const next = {};
      which.forEach((type, i) => { next[type] = answers[i].data?.rows || []; });
      setResults(next);
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

  const toggleType = (key) => {
    const next = types.includes(key) ? types.filter((t) => t !== key) : [...types, key];
    setTypes(next);
    fetchReports(next);
  };

  /* ------------------------------ export ------------------------------ */

  const exportCSV = (type) => {
    const rows = results[type] || [];
    if (!rows.length) return toast.error(`Nothing to export in ${LABEL[type]}`);

    if (type === 'presentation-marks') {
      return downloadCSV(
        rows.map((r) => ({
          date: r.heldOn ? formatDate(r.heldOn) : '',
          group: r.groupNo, groupName: r.groupName, sem: r.semester, project: r.project,
          enrollment: r.enrollmentNo, student: r.student,
          presentation: r.presentation,
          marks: r.marks ?? '', outOf: r.outOf ?? '',
          panel: r.panelMember, guides: r.guides, feedback: r.feedback,
        })),
        ['Date', 'Group', 'Group Name', 'Sem', 'Project', 'Enrollment', 'Student', 'Presentation', 'Marks', 'Out Of', 'Panel Member', 'Guides', 'Group remark'],
        'presentation_marks.csv',
      );
    }
    if (type === 'meeting-marks') {
      return downloadCSV(
        rows.map((r) => ({
          date: r.metOn ? formatDate(r.metOn) : '',
          group: r.groupNo, groupName: r.groupName, sem: r.semester, project: r.project,
          enrollment: r.enrollmentNo, student: r.student,
          meeting: r.meeting,
          marks: r.marks ?? '', outOf: r.outOf ?? '',
          guide: r.guide, remark: r.remark,
        })),
        ['Date', 'Group', 'Group Name', 'Sem', 'Project', 'Enrollment', 'Student', 'Meeting', 'Marks', 'Out Of', 'Guide', 'Group remark'],
        'guide_meeting_marks.csv',
      );
    }
    if (type === 'attendance') {
      return downloadCSV(
        rows.map((r) => ({
          date: formatDate(r.attendanceDate),
          enrollment: r.student?.enrollmentNo, student: r.student?.name,
          group: r.team?.groupNo, presentation: r.presentation?.presentationTitle, status: r.status,
        })),
        ['Date', 'Enrollment', 'Student', 'Group', 'Presentation', 'Status'],
        'attendance_report.csv',
      );
    }
    return downloadCSV(
      rows.map((r) => ({
        group: r.team?.groupNo, groupName: r.team?.groupName, sem: r.team?.semester,
        presentation: r.presentation?.presentationTitle, status: r.status,
        marks: r.marksObtained ?? '', locked: r.isLocked ? 'Yes' : 'No',
        guide: (r.team?.guides || []).map((g) => g.name).join(', ') || '',
      })),
      ['Group', 'Group Name', 'Sem', 'Presentation', 'Status', 'Marks', 'Locked', 'Guide'],
      'presentation_status.csv',
    );
  };

  /* ------------------------------ tables ------------------------------ */

  const StudentCell = ({ name, enrollmentNo }) => (
    <td>
      <div className="text-sm">{name || DASH}</div>
      <div className="text-xs text-slate-500 font-mono">{enrollmentNo}</div>
    </td>
  );

  const renderTable = (type) => {
    const rows = results[type] || [];
    if (!rows.length) {
      return <EmptyState icon={Inbox} title="No records found" message="Try changing the filters above." />;
    }

    if (type === 'presentation-marks') {
      return (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Group</th><th>Student</th><th>Project</th><th>Presentation</th><th>Marks</th><th>Panel member</th><th>Group remark</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="whitespace-nowrap">{r.heldOn ? formatDate(r.heldOn) : <span className="text-slate-400">not recorded</span>}</td>
                  <td>
                    <div className="font-semibold">{r.groupNo}</div>
                    <div className="text-xs text-slate-500">{r.groupName}</div>
                  </td>
                  <StudentCell name={r.student} enrollmentNo={r.enrollmentNo} />
                  <td className="text-sm">{r.project || DASH}</td>
                  <td className="text-sm">{r.presentation}</td>
                  <td className="font-semibold whitespace-nowrap">
                    {r.marks ?? DASH}{r.outOf != null ? <span className="text-xs text-slate-500"> / {r.outOf}</span> : null}
                  </td>
                  <td className="text-sm">{r.panelMember || DASH}</td>
                  <td className="text-xs text-slate-500 max-w-[220px] truncate" title={r.feedback}>{r.feedback || DASH}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (type === 'meeting-marks') {
      return (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              {/* Eight columns, eight cells. The header had been left at
                  seven, so every row sat one column out. */}
              <tr><th>Date</th><th>Group</th><th>Student</th><th>Project</th><th>Meeting</th><th>Marks</th><th>Guide</th><th>Group remark</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="whitespace-nowrap">{r.metOn ? formatDate(r.metOn) : <span className="text-slate-400">not recorded</span>}</td>
                  <td>
                    <div className="font-semibold">{r.groupNo}</div>
                    <div className="text-xs text-slate-500">{r.groupName}</div>
                  </td>
                  <StudentCell name={r.student} enrollmentNo={r.enrollmentNo} />
                  <td className="text-sm">{r.project || DASH}</td>
                  <td className="text-sm">{r.meeting}</td>
                  <td className="font-semibold whitespace-nowrap">
                    {r.marks ?? DASH}{r.outOf != null ? <span className="text-xs text-slate-500"> / {r.outOf}</span> : null}
                  </td>
                  <td className="text-sm">{r.guide || DASH}</td>
                  <td className="text-xs text-slate-500 max-w-[200px] truncate" title={r.remark}>{r.remark || DASH}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (type === 'attendance') {
      return (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Enrollment</th><th>Student</th><th>Group</th><th>Presentation</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Group</th><th>Sem</th><th>Presentation</th><th>Status</th><th>Marks</th><th>Locked</th><th>Guide</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>
                  <div className="font-semibold">{r.team?.groupNo}</div>
                  <div className="text-xs text-slate-500">{r.team?.groupName}</div>
                </td>
                <td><span className="badge-info">{r.team?.semester}th</span></td>
                <td>{r.presentation?.presentationTitle}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>{r.marksObtained ?? DASH}</td>
                <td>{r.isLocked ? <span className="badge-secondary"><Lock className="w-3 h-3" /> Locked</span> : DASH}</td>
                <td className="text-sm">{(r.team?.guides || []).map((g) => g.name).join(', ') || DASH}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /* ------------------------------- page ------------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Attendance, presentation status, presentation marks and guide meeting marks {DASH} by
          project, by group and by date. Marks are listed per student. Pick as many reports as you
          want to see together.
        </p>
      </div>

      <Card>
        <div className="mb-4">
          <label className="form-label">Reports to show</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const on = types.includes(t.key);
              return (
                <button key={t.key} type="button" onClick={() => toggleType(t.key)}
                  className={on ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}>
                  {t.label}
                  {on && results[t.key] && (
                    <span className="badge-secondary ml-1">{results[t.key].length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={apply} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                    {t.groupNo}{t.groupName ? ` ${DASH} ${t.groupName}` : ''}
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
          <div className="flex items-end sm:col-span-2">
            <button className="btn-primary w-full"><Filter className="w-4 h-4" /> Apply</button>
          </div>
          {marksShown && (filters.from || filters.to) && (
            <p className="sm:col-span-4 text-xs text-slate-500">
              Dates match the day the presentation or meeting was held, not the day the marks were
              entered. Records saved before that date was recorded will not appear in a dated search.
            </p>
          )}
        </form>
      </Card>

      {types.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="No report selected" message="Pick at least one report above." />
        </Card>
      ) : loading ? (
        <Card><div className="py-10 flex justify-center"><Spinner /></div></Card>
      ) : (
        types.map((type) => (
          <Card
            key={type}
            title={<>{LABEL[type]} <span className="badge-secondary ml-1">{(results[type] || []).length}</span></>}
            icon={Table2}
            noPadding
            action={(
              <button onClick={() => exportCSV(type)} className="btn-success btn-sm">
                <Download className="w-4 h-4" /> CSV
              </button>
            )}
          >
            {renderTable(type)}
          </Card>
        ))
      )}
    </div>
  );
};

export default Reports;
