import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Loader2, Search, Download, RefreshCw, X, ChevronRight, Users, ClipboardList,
  ListChecks, GraduationCap, FileCheck2, MessageSquareText, FolderOpen, Activity, FlaskConical,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "2-digit" }) : "—";
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : null);
const pctText = (part, total) => {
  const p = pct(part, total);
  return p === null ? "—" : `${p}%`;
};

// Every column the admin can sort/see. Keeping them in one list keeps the
// header, the cells and the sort in step.
const COLUMNS = [
  { key: "load", label: "Load", hint: "Subjects · sections", get: (r) => r.load.subjects },
  { key: "weekly", label: "Weekly report", hint: "Submitted / total", get: (r) => pct(r.weekly.submitted, r.weekly.reports) ?? -1 },
  { key: "tasks", label: "Tasks", hint: "Completed / assigned", get: (r) => pct(r.tasks.completed, r.tasks.assigned) ?? -1 },
  { key: "sessional", label: "Sessional", hint: "Sheets · CA entries", get: (r) => r.sessional.sheets },
  { key: "noDues", label: "No Dues", hint: "Ticked / items", get: (r) => pct(r.noDues.checked, r.noDues.items) ?? -1 },
  { key: "feedback", label: "Feedback", hint: "Avg of 5", get: (r) => r.feedback.avg ?? -1 },
  { key: "material", label: "Material", hint: "Notes + question banks", get: (r) => r.material.notes + r.material.questionBanks },
  { key: "tg", label: "TG", hint: "Mentees", get: (r) => r.tg.mentees },
  { key: "pms", label: "PMS", hint: "Groups guided", get: (r) => r.pms.teams },
  { key: "activity", label: "Last active", hint: "System actions", get: (r) => (r.activity.lastActive ? new Date(r.activity.lastActive).getTime() : 0) },
];

const Bar = ({ part, total }) => {
  const p = pct(part, total);
  if (p === null) return <span className="text-[var(--text-secondary)]">—</span>;
  const tone = p >= 80 ? "bg-emerald-500" : p >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="min-w-[84px]">
      <div className="text-xs font-bold text-[var(--text-primary)]">{part}/{total} <span className="text-[var(--text-secondary)] font-medium">({p}%)</span></div>
      <div className="h-1.5 rounded-full bg-[var(--bg-input)] mt-1 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
};

export default function FacultyReportsPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: "", to: "", department: "", q: "" });
  const [sort, setSort] = useState({ key: "load", dir: "desc" });
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/faculty-reports?${params.toString()}`);
      setRows(data.data || []);
      setDepartments(data.departments || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load faculty reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.key);
    const list = [...rows];
    list.sort((a, b) => {
      const av = col ? col.get(a) : 0;
      const bv = col ? col.get(b) : 0;
      if (av === bv) return a.faculty.name.localeCompare(b.faculty.name);
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [rows, sort]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    faculty: acc.faculty + 1,
    hours: acc.hours + r.weekly.hours,
    tasks: acc.tasks + r.tasks.assigned,
    pending: acc.pending + r.tasks.pending,
    mentees: acc.mentees + r.tg.mentees,
  }), { faculty: 0, hours: 0, tasks: 0, pending: 0, mentees: 0 }), [rows]);

  const download = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/faculty-reports/export?${params.toString()}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `faculty-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error("Could not download the report");
    }
  };

  const setSortKey = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]";

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
            <BarChart3 size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Faculty Reports</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Every faculty member in one table — teaching load, weekly reports, tasks, marks entry, No Dues, feedback, material, TG and PMS work.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            [Users, totals.faculty, "Faculty"],
            [ClipboardList, Math.round(totals.hours), "Hours logged"],
            [ListChecks, totals.pending, "Tasks pending"],
            [GraduationCap, totals.mentees, "TG students"],
          ].map(([Icon, value, label]) => (
            <div key={label} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl px-4 py-2.5 min-w-[96px]">
              <div className="flex items-center gap-1.5 text-[var(--primary)]"><Icon size={13} /><span className="text-lg font-display font-black text-[var(--text-primary)]">{value}</span></div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
          From
          <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className={inputCls} />
        </label>
        <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
          To
          <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className={inputCls} />
        </label>
        <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
          Department
          <select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))} className={inputCls}>
            <option value="">All</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5 flex-1 min-w-[180px]">
          Search
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-60" />
            <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Name, email or department"
              className={`${inputCls} w-full pl-9`} />
          </div>
        </label>
        <button onClick={load} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5"><RefreshCw size={13} /> Apply</button>
        <button onClick={download} className="btn-outline-premium text-xs px-4 py-2.5 flex items-center gap-1.5"><Download size={13} /> Export CSV</button>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">No faculty found for these filters.</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Faculty</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="px-4 py-3">
                    <button onClick={() => setSortKey(c.key)} className={`flex flex-col items-start ${sort.key === c.key ? "text-[var(--primary)]" : ""}`}>
                      <span className="font-black">{c.label}{sort.key === c.key ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}</span>
                      <span className="font-medium normal-case tracking-normal opacity-70">{c.hint}</span>
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.faculty._id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-input)]/50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.faculty.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {(r.faculty.roles?.length ? r.faculty.roles : [r.faculty.role]).join(" + ")}
                      {r.faculty.department ? ` · ${r.faculty.department}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.load.subjects} subj</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {r.load.sections} sec · {r.load.lectureHours + r.load.practicalHours} hrs
                      {r.load.labSupport > 0 ? ` · ${r.load.labSupport} lab` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Bar part={r.weekly.submitted} total={r.weekly.reports} /><div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.weekly.hours} hrs</div></td>
                  <td className="px-4 py-3"><Bar part={r.tasks.completed} total={r.tasks.assigned} /><div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.tasks.pending} pending</div></td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.sessional.sheets}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.sessional.entries} entries · {r.sessional.locked} locked</div>
                  </td>
                  <td className="px-4 py-3"><Bar part={r.noDues.checked} total={r.noDues.items} /></td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.feedback.avg ?? "—"}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.feedback.count} student{r.feedback.count === 1 ? "" : "s"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.material.notes + r.material.questionBanks}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.material.notes} notes · {r.material.questionBanks} QB</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.tg.mentees}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.tg.gatePassDecisions} gate pass</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{r.pms.teams}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.pms.meetingMarks} mtg · {r.pms.rubrics} rub</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{fmtDate(r.activity.lastActive)}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.activity.actions} actions</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setOpenId(r.faculty._id)} className="btn-outline-premium text-xs px-3 py-1.5 flex items-center gap-1 ml-auto">
                      Details <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && <FacultyDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

// One block inside the drill-down. Declared here, not inside the dialog —
// a component created during render would remount on every state change.
const Section = ({ icon: Icon, title, count, children, empty }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-display font-black text-[var(--text-primary)] flex items-center gap-2">
      <Icon size={15} className="text-[var(--primary)]" /> {title}
      {count !== undefined && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]">{count}</span>}
    </h3>
    {count === 0 ? <p className="text-xs text-[var(--text-secondary)]">{empty}</p> : children}
  </div>
);

const list = (items) => (
  <div className="space-y-1.5">
    {items.map((line, i) => (
      <div key={i} className="text-xs bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-[var(--text-primary)]">{line}</div>
    ))}
  </div>
);

// The full picture for one faculty member — the same blocks as the table,
// expanded into the rows behind each number.
const FacultyDetail = ({ id, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/faculty-reports/${id}`);
        setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load the details");
        onClose();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-card w-full max-w-4xl rounded-3xl p-6 my-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        {loading || !data ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-black text-[var(--text-primary)]">{data.faculty.name}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {(data.faculty.roles?.length ? data.faculty.roles : [data.faculty.role]).join(" + ")}
                  {data.faculty.department ? ` · ${data.faculty.department}` : ""}
                  {data.faculty.designation ? ` · ${data.faculty.designation}` : ""}
                  {data.faculty.email ? ` · ${data.faculty.email}` : ""}
                </p>
                {(data.faculty.responsibilities || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.faculty.responsibilities.map((x) => (
                      <span key={x} className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">{x}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Section icon={GraduationCap} title="Teaching load" count={data.load.length} empty="No subject allocated yet.">
                {list(data.load.map((l) => `${l.subject}${l.code ? ` (${l.code})` : ""} — ${l.batch} · Sem ${l.semester} · Sec ${l.section} · ${l.role}`))}
              </Section>

              <Section icon={ClipboardList} title="Weekly work reports" count={data.weekly.length} empty="No weekly report filed yet.">
                {list(data.weekly.map((w) => `${fmtDate(w.weekOf)} — ${w.status}${w.autoSubmitted ? " (auto)" : ""} · ${w.entries} entries · ${w.hours} hrs`))}
              </Section>

              <Section icon={ListChecks} title="Tasks" count={data.tasks.length} empty="No task assigned.">
                {list(data.tasks.map((t) => `${t.title} — ${t.status}${t.dueDate ? ` · due ${fmtDate(t.dueDate)}` : ""}`))}
              </Section>

              <Section icon={GraduationCap} title="Sessional marks sheets" count={data.sessional.length} empty="No sheet owned.">
                {list(data.sessional.map((s) => `${s.subject} — ${s.batch} Sem ${s.semester} Sec ${s.section} · ${s.entries} CA entries${s.locked ? " · locked" : ""}`))}
              </Section>

              <Section icon={FileCheck2} title="No Dues (their subjects)" count={data.noDues.length} empty="No No Dues row assigned.">
                {list(data.noDues.map((n) => `${n.student}${n.enrollment ? ` (${n.enrollment})` : ""} — ${n.subjects.join(", ")} · ${n.checked}/${n.total} ticked (${pctText(n.checked, n.total)})`))}
              </Section>

              <Section icon={MessageSquareText} title="Student feedback" count={data.feedback.length} empty="No feedback received yet.">
                {list(data.feedback.map((f) => `${f.subject} — ${f.avg}/5 from ${f.ratings} ratings`))}
              </Section>

              <Section icon={FolderOpen} title="Material uploaded" count={data.material.length} empty="No notes or question banks uploaded.">
                {list(data.material.map((m) => `${m.kind}: ${m.title} — ${m.subject} · ${fmtDate(m.at)}`))}
              </Section>

              <Section icon={FlaskConical} title="PMS groups" count={data.pmsTeams.length} empty="Not guiding any project group.">
                {list(data.pmsTeams.map((t) => `${t.groupNo} — ${t.groupName}${t.projectTitle ? ` · ${t.projectTitle}` : ""}`))}
              </Section>

              <Section icon={Users} title="TG students" count={data.mentees.length} empty="No tutor group assigned.">
                {list(data.mentees.map((m) => `${m.name}${m.enrollmentNumber ? ` (${m.enrollmentNumber})` : ""} — Sem ${m.semester || "—"} Sec ${m.section || "—"}`))}
              </Section>

              <Section icon={Activity} title="Recent activity" count={data.recentActivity.length} empty="No recorded actions yet.">
                {list(data.recentActivity.map((a) => `${fmtDate(a.createdAt)} — ${a.description} (${a.statusCode})`))}
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
