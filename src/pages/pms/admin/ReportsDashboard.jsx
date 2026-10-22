import { useState, useEffect, useMemo } from 'react';
import {
  Filter, Download, Table2, Search, RotateCcw, Users, UsersRound, GraduationCap, Percent,
  CalendarCheck, FileCheck2, FileClock, FileX2, FileQuestion, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, StatCard } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

// PMS reports dashboard. The server answers every report for one set of
// filters (year, semester, project, guide, section, group, dates); the page
// then searches and narrows each report on the spot, and exports exactly
// what is on screen — one report, or every report as sheets of one Excel.

const DASH = '—';
const PAGE = 50;
const DOC_STATUS = {
  accepted: 'Accepted', pending: 'Waiting for review', rejected: 'Rejected', not_submitted: 'Not submitted',
};
const APPROVAL = { draft: 'Draft', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
const ATT = { present: 'Present', late: 'Late', absent: 'Absent' };
const BASIS = { held: '', met: '', scheduled: ' (scheduled date)', entered: ' (marks entered on)' };

const num = (v) => (v === null || v === undefined || v === '' ? null : v);
const day = (d) => (d ? formatDate(d) : '');

// Columns shared by every report: where the row belongs.
const GROUP_COLS = [
  { key: 'year', label: 'Year' },
  { key: 'semester', label: 'Sem' },
  { key: 'section', label: 'Section' },
  { key: 'groupNo', label: 'Group' },
  { key: 'groupName', label: 'Group Name' },
];

// Each report: its columns (shared by the table and the Excel sheet), and
// which field its status filter reads, if it has one.
const buildReports = (columns) => ({
  marks: {
    label: 'Consolidated Marks',
    sheet: 'Consolidated Marks',
    cols: [
      ...GROUP_COLS,
      { key: 'enrollmentNo', label: 'Enrollment' },
      { key: 'student', label: 'Student' },
      { key: 'guides', label: 'Guide(s)' },
      ...columns.rounds.map((r) => ({ key: `round:${r.key}`, label: r.label, get: (row) => num(row.rounds?.[r.key]), numeric: true })),
      { key: 'presentationTotal', label: 'Presentations', get: (r) => (r.presentationMax ? `${r.presentationTotal}/${r.presentationMax}` : ''), sortBy: (r) => r.presentationTotal },
      ...columns.meetings.map((m) => ({ key: `meet:${m.key}`, label: m.label, get: (row) => num(row.meetings?.[m.key]), numeric: true })),
      { key: 'meetingTotal', label: 'Meetings', get: (r) => (r.meetingMax ? `${r.meetingTotal}/${r.meetingMax}` : ''), sortBy: (r) => r.meetingTotal },
      { key: 'total', label: 'Total', get: (r) => (r.max ? `${r.total}/${r.max}` : ''), sortBy: (r) => r.total },
      { key: 'percent', label: 'Score %', numeric: true },
      { key: 'attendancePercent', label: 'Attendance %', numeric: true },
    ],
    status: { label: 'Score', field: (r) => band(r.percent), options: ['90+', '75–90', '60–75', '40–60', 'Below 40', 'No marks yet'] },
  },
  groups: {
    label: 'Groups',
    sheet: 'Groups',
    cols: [
      ...GROUP_COLS,
      { key: 'projectTitle', label: 'Project Title' },
      { key: 'project', label: 'Project' },
      { key: 'teamType', label: 'Type' },
      { key: 'leader', label: 'Leader' },
      { key: 'memberCount', label: 'Members', numeric: true },
      { key: 'members', label: 'Member list' },
      { key: 'guides', label: 'Guide(s)' },
      { key: 'domain', label: 'Domain' },
      { key: 'approval', label: 'Details', get: (r) => APPROVAL[r.approval] || r.approval },
      { key: 'locked', label: 'Locked', get: (r) => (r.locked ? 'Yes' : 'No') },
    ],
    status: { label: 'Details', field: (r) => APPROVAL[r.approval] || r.approval, options: Object.values(APPROVAL) },
  },
  documents: {
    label: 'Documents',
    sheet: 'Documents',
    cols: [
      ...GROUP_COLS,
      { key: 'round', label: 'Round' },
      { key: 'presentation', label: 'Presentation' },
      { key: 'guides', label: 'Guide(s)' },
      { key: 'status', label: 'Status', get: (r) => DOC_STATUS[r.status] || r.status },
      { key: 'submittedAt', label: 'Uploaded on', get: (r) => day(r.submittedAt), sortBy: (r) => r.submittedAt || '' },
      { key: 'reviewedAt', label: 'Reviewed on', get: (r) => day(r.reviewedAt), sortBy: (r) => r.reviewedAt || '' },
      { key: 'reviewedBy', label: 'Reviewed by' },
      { key: 'comment', label: 'Guide comment' },
      { key: 'files', label: 'Files', get: (r) => [r.hasPpt && 'PPT', r.hasReport && 'Report', r.gitUrl && 'Git'].filter(Boolean).join(', ') },
    ],
    status: { label: 'Status', field: (r) => DOC_STATUS[r.status] || r.status, options: Object.values(DOC_STATUS) },
  },
  presentationMarks: {
    label: 'Presentation Marks',
    sheet: 'Presentation Marks',
    cols: [
      { key: 'heldOn', label: 'Date', get: (r) => `${day(r.heldOn)}${BASIS[r.heldOnBasis] || ''}`, sortBy: (r) => r.heldOn || '' },
      ...GROUP_COLS,
      { key: 'round', label: 'Round' },
      { key: 'presentation', label: 'Presentation' },
      { key: 'enrollmentNo', label: 'Enrollment' },
      { key: 'student', label: 'Student' },
      { key: 'marks', label: 'Marks', numeric: true },
      { key: 'outOf', label: 'Out of', numeric: true },
      { key: 'remark', label: 'Remark' },
      { key: 'panel', label: 'Panel' },
      { key: 'enteredBy', label: 'Entered by' },
      { key: 'guides', label: 'Guide(s)' },
      { key: 'feedback', label: 'Group feedback' },
    ],
    status: { label: 'Round', field: (r) => r.round },
  },
  meetingMarks: {
    label: 'Guide Meeting Marks',
    sheet: 'Meeting Marks',
    cols: [
      { key: 'metOn', label: 'Date', get: (r) => `${day(r.metOn)}${BASIS[r.metOnBasis] || ''}`, sortBy: (r) => r.metOn || '' },
      ...GROUP_COLS,
      { key: 'meeting', label: 'Meeting' },
      { key: 'enrollmentNo', label: 'Enrollment' },
      { key: 'student', label: 'Student' },
      { key: 'marks', label: 'Marks', numeric: true },
      { key: 'outOf', label: 'Out of', numeric: true },
      { key: 'guide', label: 'Guide' },
      { key: 'remark', label: 'Remark' },
    ],
    status: { label: 'Meeting', field: (r) => r.meeting },
  },
  attendance: {
    label: 'Attendance',
    sheet: 'Attendance',
    cols: [
      { key: 'date', label: 'Date', get: (r) => day(r.date), sortBy: (r) => r.date || '' },
      ...GROUP_COLS,
      { key: 'enrollmentNo', label: 'Enrollment' },
      { key: 'student', label: 'Student' },
      { key: 'presentation', label: 'Presentation' },
      { key: 'status', label: 'Status', get: (r) => ATT[r.status] || r.status },
      { key: 'markedBy', label: 'Marked by' },
      { key: 'remarks', label: 'Remarks' },
    ],
    status: { label: 'Status', field: (r) => ATT[r.status] || r.status, options: Object.values(ATT) },
  },
  guides: {
    label: 'Guide Load',
    sheet: 'Guide Load',
    cols: [
      { key: 'guide', label: 'Guide' },
      { key: 'email', label: 'Email' },
      { key: 'groups', label: 'Groups', numeric: true },
      { key: 'students', label: 'Students', numeric: true },
      { key: 'groupList', label: 'Group list' },
      { key: 'panels', label: 'Panels', numeric: true },
      { key: 'meetingMarks', label: 'Meeting marks given', numeric: true },
      { key: 'docsPending', label: 'Docs to review', numeric: true },
      { key: 'docsAccepted', label: 'Docs accepted', numeric: true },
      { key: 'docsRejected', label: 'Docs rejected', numeric: true },
    ],
  },
});

const band = (p) => {
  if (p === null || p === undefined) return 'No marks yet';
  if (p >= 90) return '90+';
  if (p >= 75) return '75–90';
  if (p >= 60) return '60–75';
  if (p >= 40) return '40–60';
  return 'Below 40';
};

const cellValue = (col, row) => (col.get ? col.get(row) : row[col.key]);

// What the search box looks through, per row.
const haystack = (row) => [
  row.student, row.enrollmentNo, row.groupNo, row.groupName, row.guides, row.guide,
  row.projectTitle, row.presentation, row.meeting, row.members, row.leader, row.email, row.comment, row.remark,
].filter(Boolean).join(' ').toLowerCase();

const blankFilters = { yearId: '', semester: '', projectId: '', guideId: '', section: '', teamId: '', from: '', to: '' };

const ReportsDashboard = () => {
  const [filters, setFilters] = useState(blankFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [guides, setGuides] = useState([]);

  const [tab, setTab] = useState('marks');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: '', dir: 1 });
  const [page, setPage] = useState(0);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      const res = await adminAPI.reportDashboard(params);
      setData(res.data);
      setPage(0);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // First load: `loading` already starts true.
    adminAPI.reportDashboard()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(handleError(err)))
      .finally(() => setLoading(false));
    // The pickers; a failure only leaves that picker empty.
    Promise.allSettled([adminAPI.listYears(), adminAPI.listProjects(), adminAPI.listTeams({ limit: 1000 }), adminAPI.listGuides()])
      .then(([y, p, t, g]) => {
        if (y.status === 'fulfilled') {
          const list = y.value.data.years || [];
          setYears(list);
        }
        if (p.status === 'fulfilled') setProjects(p.value.data?.projects || p.value.data?.data || []);
        if (t.status === 'fulfilled') setTeams(t.value.data?.teams || t.value.data?.data || []);
        if (g.status === 'fulfilled') setGuides(g.value.data?.guides || []);
      });
  }, []);

  const REPORTS = useMemo(() => buildReports(data?.columns || { rounds: [], meetings: [] }), [data]);
  const report = REPORTS[tab];
  const sections = useMemo(() => [...new Set(teams.map((t) => t.section).filter(Boolean))].sort(), [teams]);

  // Search, status and sort — on what the server sent for this report.
  const rowsFor = (key, { applyStatus = true } = {}) => {
    const r = REPORTS[key];
    let rows = data?.[key === 'marks' ? 'students' : key] || [];
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((row) => haystack(row).includes(q));
    if (applyStatus && key === tab && status && r.status) rows = rows.filter((row) => r.status.field(row) === status);
    return rows;
  };
  const shown = useMemo(() => {
    const rows = [...rowsFor(tab)];
    if (sort.key) {
      const col = report.cols.find((c) => c.key === sort.key);
      const val = (row) => (col?.sortBy ? col.sortBy(row) : cellValue(col, row));
      rows.sort((a, b) => {
        const x = val(a); const y = val(b);
        if (x === y) return 0;
        if (x === null || x === undefined || x === '') return 1;
        if (y === null || y === undefined || y === '') return -1;
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * sort.dir;
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tab, search, status, sort, REPORTS]);

  const statusOptions = useMemo(() => {
    if (!report?.status) return [];
    if (report.status.options) return report.status.options;
    return [...new Set((data?.[tab] || []).map(report.status.field).filter(Boolean))].sort();
  }, [report, data, tab]);

  const switchTab = (key) => { setTab(key); setStatus(''); setSort({ key: '', dir: 1 }); setPage(0); };
  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));

  /* ------------------------------ Excel ------------------------------ */

  const sheetOf = (key, rows) => {
    const cols = REPORTS[key].cols;
    const aoa = [cols.map((c) => c.label), ...rows.map((row) => cols.map((c) => {
      const v = cellValue(c, row);
      return v === null || v === undefined ? '' : v;
    }))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = cols.map((c) => ({ wch: Math.min(40, Math.max(c.label.length + 2, ...rows.slice(0, 200).map((r) => String(cellValue(c, r) ?? '').length + 1))) }));
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: cols.length - 1, r: Math.max(rows.length, 1) } }) };
    return ws;
  };
  const filterLine = () => {
    const parts = [];
    const y = years.find((x) => x._id === filters.yearId); if (y) parts.push(y.yearName);
    if (filters.semester) parts.push(`Sem ${filters.semester}`);
    if (filters.section) parts.push(`Sec ${filters.section}`);
    const g = guides.find((x) => x._id === filters.guideId); if (g) parts.push(g.name);
    const t = teams.find((x) => x._id === filters.teamId); if (t) parts.push(t.groupNo);
    if (filters.from || filters.to) parts.push(`${filters.from || '…'} to ${filters.to || '…'}`);
    return parts;
  };
  const fileName = (what) => `PMS_${what}${filterLine().length ? `_${filterLine().join('_')}` : ''}_${new Date().toISOString().slice(0, 10)}.xlsx`
    .replace(/[^A-Za-z0-9_.\-–]+/g, '_');

  const exportOne = () => {
    if (!shown.length) return toast.error('Nothing to export');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheetOf(tab, shown), report.sheet);
    XLSX.writeFile(wb, fileName(report.sheet.replace(/\s+/g, '_')));
  };
  const exportAll = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    // A first sheet that says what the file holds.
    const s = data.summary;
    const info = [
      ['PMS Report'], ['Generated', new Date().toLocaleString('en-IN')], ['Filters', filterLine().join(' · ') || 'All'],
      ...(search ? [['Search', search]] : []), [],
      ['Groups', s.groups], ['Students', s.students], ['Guides', s.guides], ['Presentations', s.presentations],
      ['Average score %', s.avgPercent ?? ''], ['Attendance %', s.attendancePercent ?? ''],
      ['Documents accepted', s.docs.accepted], ['Documents waiting for review', s.docs.pending],
      ['Documents rejected', s.docs.rejected], ['Documents not submitted', s.docs.notSubmitted],
    ];
    const infoWs = XLSX.utils.aoa_to_sheet(info);
    infoWs['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, infoWs, 'Summary');
    Object.keys(REPORTS).forEach((key) => {
      XLSX.utils.book_append_sheet(wb, sheetOf(key, rowsFor(key, { applyStatus: false })), REPORTS[key].sheet);
    });
    XLSX.writeFile(wb, fileName('All_Reports'));
  };

  /* ------------------------------ charts ------------------------------ */

  const docChart = data ? [
    { name: 'Accepted', value: data.summary.docs.accepted, color: '#10b981' },
    { name: 'Waiting', value: data.summary.docs.pending, color: '#f59e0b' },
    { name: 'Rejected', value: data.summary.docs.rejected, color: '#ef4444' },
    { name: 'Not submitted', value: data.summary.docs.notSubmitted, color: '#94a3b8' },
  ] : [];
  const scoreChart = useMemo(() => {
    const bands = ['Below 40', '40–60', '60–75', '75–90', '90+'];
    const counts = Object.fromEntries(bands.map((b) => [b, 0]));
    (data?.students || []).forEach((s) => { const b = band(s.percent); if (b in counts) counts[b] += 1; });
    return bands.map((b) => ({ name: b, value: counts[b] }));
  }, [data]);

  /* ------------------------------ render ------------------------------ */

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, ...(k === 'projectId' ? { teamId: '' } : {}) }));
  const teamChoices = teams.filter((t) => (!filters.semester || String(t.semester) === String(filters.semester))
    && (!filters.projectId || String(t.project?._id || t.project) === filters.projectId)
    && (!filters.section || t.section === filters.section));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const pageRows = shown.slice(page * PAGE, page * PAGE + PAGE);
  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every PMS report from one set of filters — search, narrow, sort, and download to Excel.
          </p>
        </div>
        <button onClick={exportAll} disabled={!data || loading} className="btn-success">
          <FileSpreadsheet className="w-4 h-4" /> Download all reports (Excel)
        </button>
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Academic Year</label>
            <select className="form-select" value={filters.yearId} onChange={set('yearId')}>
              <option value="">All years</option>
              {years.map((y) => <option key={y._id} value={y._id}>{y.yearName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Semester</label>
            <select className="form-select" value={filters.semester} onChange={set('semester')}>
              <option value="">All</option>
              {[5, 6, 7, 8].map((n) => <option key={n} value={n}>Sem {n}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-select" value={filters.section} onChange={set('section')}>
              <option value="">All</option>
              {sections.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Project</label>
            <select className="form-select" value={filters.projectId} onChange={set('projectId')}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.title || p.projectName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Guide</label>
            <select className="form-select" value={filters.guideId} onChange={set('guideId')}>
              <option value="">All guides</option>
              {guides.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Group</label>
            <select className="form-select" value={filters.teamId} onChange={set('teamId')}>
              <option value="">All groups</option>
              {teamChoices.map((t) => <option key={t._id} value={t._id}>{t.groupNo}{t.groupName ? ` ${DASH} ${t.groupName}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={filters.from} onChange={set('from')} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={filters.to} onChange={set('to')} />
          </div>
          <div className="col-span-2 md:col-span-4 flex flex-wrap gap-2 items-center">
            <button className="btn-primary" disabled={loading}><Filter className="w-4 h-4" /> Apply filters</button>
            <button type="button" className="btn-outline" disabled={loading}
              onClick={() => { setFilters(blankFilters); setSearch(''); setStatus(''); load(blankFilters); }}>
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            {(filters.from || filters.to) && (
              <span className="text-xs text-slate-500">
                Dates narrow the dated reports (marks, meetings, attendance, documents). Consolidated Marks always covers the whole term.
              </span>
            )}
          </div>
        </form>
      </Card>

      {loading && !data ? (
        <Card><div className="py-16 flex justify-center"><Spinner size="lg" /></div></Card>
      ) : !data ? (
        <Card><EmptyState icon={Table2} title="No data" message="The report could not be loaded." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Groups" value={s.groups} icon={UsersRound} color="primary"
              meta={`${s.approvals.approved || 0} approved · ${s.approvals.pending || 0} pending`} />
            <StatCard label="Students" value={s.students} icon={Users} color="info" meta={`${s.guides} guides · ${s.presentations} presentations`} />
            <StatCard label="Average score" value={s.avgPercent != null ? `${s.avgPercent}%` : DASH} icon={Percent} color="success" meta="Presentations + meetings" />
            <StatCard label="Attendance" value={s.attendancePercent != null ? `${s.attendancePercent}%` : DASH} icon={CalendarCheck} color="warning" meta="Present or late" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Docs accepted" value={s.docs.accepted} icon={FileCheck2} color="success" />
            <StatCard label="Docs to review" value={s.docs.pending} icon={FileClock} color="warning" />
            <StatCard label="Docs rejected" value={s.docs.rejected} icon={FileX2} color="danger" />
            <StatCard label="Docs not submitted" value={s.docs.notSubmitted} icon={FileQuestion} color="info" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Documents by status" icon={FileCheck2}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Rounds" radius={[6, 6, 0, 0]}>
                      {docChart.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Students by score" icon={GraduationCap}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card noPadding>
            <div className="flex gap-1.5 flex-wrap px-4 pt-4" role="tablist">
              {Object.entries(REPORTS).map(([key, r]) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => switchTab(key)}
                  className={tab === key ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}>
                  {r.label}
                  <span className="badge-secondary ml-1">{rowsFor(key, { applyStatus: false }).length}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-slate-100">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="Search student, enrollment, group, guide, title…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} aria-label="Search reports" />
              </div>
              {report.status && (
                <div>
                  <label className="form-label">{report.status.label}</label>
                  <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label={`${report.status.label} filter`}>
                    <option value="">All</option>
                    {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <button onClick={exportOne} className="btn-success" disabled={!shown.length}>
                <Download className="w-4 h-4" /> Excel — {report.label} ({shown.length})
              </button>
              {loading && <Spinner size="sm" />}
            </div>

            {shown.length === 0 ? (
              <div className="p-6"><EmptyState icon={Table2} title="Nothing here" message="No rows match these filters." /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {report.cols.map((c) => (
                          <th key={c.key} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                            <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-brand-600">
                              {c.label}
                              <ArrowUpDown className={`w-3 h-3 ${sort.key === c.key ? 'text-brand-600' : 'opacity-40'}`} />
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, i) => (
                        <tr key={row._id || `${row.groupNo}-${row.enrollmentNo}-${row.guide}-${i}`} className="hover:bg-slate-50/70">
                          {report.cols.map((c) => {
                            const v = cellValue(c, row);
                            return (
                              <td key={c.key} className={`px-3 py-2 border-b border-slate-100 ${c.numeric ? 'tabular-nums whitespace-nowrap text-right' : 'max-w-[280px] truncate whitespace-nowrap'}`} title={typeof v === 'string' && v.length > 30 ? v : undefined}>
                                {v === null || v === undefined || v === '' ? <span className="text-slate-300">{DASH}</span> : String(v)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
                  <span>Showing {page * PAGE + 1}–{Math.min(shown.length, (page + 1) * PAGE)} of {shown.length}</span>
                  <div className="flex items-center gap-1">
                    <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-2">Page {page + 1} / {pages}</span>
                    <button className="btn-outline btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsDashboard;
