import { useState, useEffect, useMemo } from "react";
import { ClipboardList, Loader2, Download, Users, Calendar, LayoutGrid, Mail, Clock, Save, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { downloadFile } from "../../utils/downloadFile";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "on_track", label: "On Track" },
  { value: "complete", label: "Complete" },
  { value: "reject", label: "Reject" },
];
const STATUS_BADGE = {
  pending: "bg-amber-500/10 text-amber-500",
  on_track: "bg-blue-500/10 text-blue-500",
  complete: "bg-green-500/10 text-green-500",
  reject: "bg-red-500/10 text-red-500",
};

const MODES = [
  { id: "overall", label: "Overall", icon: LayoutGrid },
  { id: "faculty", label: "Faculty-wise", icon: Users },
  { id: "date", label: "Date-wise", icon: Calendar },
];

// Weeks run Saturday → Friday; the Friday ("YYYY-MM-DD") names the week.
const weekFriday = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
};

// One faculty's week as a grid: every task they reported down the left,
// the seven days of the week across the top. A green tick means that task
// was worked on that day (hover shows the hours), a red cross means it
// wasn't. The counts on the edges are what an admin actually reads.
const dayKey = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// Every faculty down the side, the seven days across the top. No task text
// on purpose: this view answers "who filled their week, and how much", and
// the detailed list below is where the work itself is read.
const AllFacultyWeek = ({ weekOf }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  // One department at a time, which is how a HOD reads this. Empty means
  // the whole college, as before.
  const [department, setDepartment] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/weekly-work-report/admin/week-matrix", {
      params: { ...(weekOf ? { weekOf } : {}), ...(department ? { department } : {}) },
    })
      .then(({ data: res }) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [weekOf, department]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/weekly-work-report/admin/week-matrix/pdf", {
        // The PDF follows whatever is on screen — a filtered view that
        // printed the whole college would be worse than no filter.
        params: { ...(weekOf ? { weekOf } : {}), ...(department ? { department } : {}) },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Weekly-Matrix-${department ? `${department}-` : ""}${data?.week?.endDay || "week"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error("Could not build the PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-16 flex justify-center rounded-3xl">
        <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
      </div>
    );
  }
  if (!data?.rows?.length) {
    return <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">No faculty found.</div>;
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-light)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] text-center sm:text-left">
          <div className="font-display font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">
            {data.heading?.department || "Department of Computer Science & Engineering"}
          </div>
          <div className="font-display font-black text-base text-[var(--text-primary)]">
            {data.heading?.title || "Weekly Report - All Faculty"}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {data.week.label} · {data.totals.submitted} of {data.totals.faculty} submitted · {data.totals.hours} hours logged
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
            <option value="">All departments</option>
            {(data.departments || []).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={downloadPdf} disabled={downloading}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead>
            <tr className="bg-[var(--primary)]/5 text-[var(--text-secondary)]">
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider sticky left-0 bg-[var(--bg-card)]">Faculty</th>
              {data.days.map((d) => (
                <th key={d.date} className="px-3 py-3 text-xs font-black uppercase tracking-wider text-center whitespace-nowrap">
                  {d.dayName.slice(0, 3)}
                  <div className="text-[11px] font-bold normal-case opacity-70">{d.date.slice(8)}/{d.date.slice(5, 7)}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-center">Days</th>
              <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-center">Hours</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.faculty._id} className="border-t border-[var(--border-light)]">
                <td className="px-4 py-2.5 sticky left-0 bg-[var(--bg-card)]">
                  <div className="font-bold text-[15px] text-[var(--text-primary)] whitespace-nowrap">{row.faculty.name}</div>
                  <div className="text-[11px]">
                    {row.submitted
                      ? <span className="text-emerald-600 font-bold">submitted</span>
                      : <span className="text-amber-600 font-bold">not submitted</span>}
                  </div>
                </td>
                {/* A tick or a cross, nothing else — the hours live in their
                    own column where they can be compared down the page. */}
                {row.perDay.map((d, i) => (
                  <td key={i} className="px-3 py-2.5 text-center">
                    {d.filled
                      ? <Check size={20} className="text-emerald-500 inline" strokeWidth={3} />
                      : <X size={20} className="text-red-400 inline" strokeWidth={3} />}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center font-black text-[15px] text-[var(--text-primary)]">
                  {row.daysFilled}/{row.workingDays || data.days.length}
                </td>
                <td className="px-3 py-2.5 text-center font-black text-[15px] text-[var(--text-primary)]">{row.totalHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The grid says who and how much; this says what they actually did. */}
      {data.rows.some((r) => r.tasks?.length) && (
        <div className="border-t border-[var(--border-light)] p-5 space-y-4">
          <h3 className="font-display font-black text-sm text-[var(--text-primary)]">
            Faculty-wise detail
          </h3>
          {data.rows.filter((r) => r.tasks?.length).map((row) => (
            <div key={row.faculty._id} className="rounded-2xl border border-[var(--border-light)] overflow-hidden">
              <div className="px-4 py-2 bg-[var(--primary)]/5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sm text-[var(--text-primary)]">{row.faculty.name}</span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {row.daysFilled}/7 days · {row.totalHours} hours ·{" "}
                  {row.submitted
                    ? <span className="text-emerald-600 font-bold">submitted</span>
                    : <span className="text-amber-600 font-bold">not submitted</span>}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[640px]">
                  <thead>
                    <tr className="text-[var(--text-secondary)] text-left">
                      <th className="px-3 py-2 font-black uppercase tracking-wider w-24">Date</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider">Task</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider w-28">Time</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider w-16">Hrs</th>
                      <th className="px-3 py-2 font-black uppercase tracking-wider w-36">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.tasks.map((t, i) => (
                      <tr key={i} className="border-t border-[var(--border-light)] align-top">
                        <td className="px-3 py-2 whitespace-nowrap text-[var(--text-secondary)]">{t.date}</td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-[var(--text-primary)]">{t.taskName}</div>
                          {t.description && (
                            <div
                              className="text-[11px] text-[var(--text-secondary)] mt-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                              dangerouslySetInnerHTML={{ __html: t.description }}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[var(--text-secondary)]">
                          {t.timeFrom || "—"}{t.timeTo ? ` – ${t.timeTo}` : ""}
                        </td>
                        <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{t.totalHours ?? 0}</td>
                        <td className="px-3 py-2">
                          <span className="capitalize text-[var(--text-primary)]">{String(t.status || "").replace("_", " ")}</span>
                          {t.expectedCompletionDate && (
                            <div className="text-[10px] text-[var(--text-secondary)]">by {t.expectedCompletionDate}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WeekMatrix = ({ report }) => {
  // The week ends on the day `weekOf` holds and runs back seven days.
  const days = useMemo(() => {
    const end = new Date(report.weekOf);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (6 - i));
      return d;
    });
  }, [report.weekOf]);

  const { rows, perDay } = useMemo(() => {
    const byTask = new Map();
    (report.tasks || []).forEach((t) => {
      if (!byTask.has(t.taskName)) byTask.set(t.taskName, new Map());
      const day = dayKey(t.date);
      const cell = byTask.get(t.taskName).get(day) || { hours: 0, entries: [] };
      cell.hours += Number(t.totalHours) || 0;
      cell.entries.push(t);
      byTask.get(t.taskName).set(day, cell);
    });
    return {
      rows: [...byTask.entries()],
      perDay: days.map((d) => (report.tasks || []).filter((t) => dayKey(t.date) === dayKey(d)).length),
    };
  }, [report.tasks, days]);

  if (rows.length === 0) {
    return <div className="px-5 py-6 text-xs text-[var(--text-secondary)]">No entries in this week.</div>;
  }

  const totalHours = Math.round((report.tasks || []).reduce((n, t) => n + (Number(t.totalHours) || 0), 0) * 100) / 100;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[760px]">
        <thead>
          <tr className="border-b border-[var(--border-light)] text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            <th className="px-4 py-2 text-left sticky left-0 bg-[var(--bg-card)]">Task</th>
            {days.map((d) => (
              <th key={d.toISOString()} className="px-2 py-2 text-center whitespace-nowrap">
                {d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" })}
                <div className="font-medium normal-case tracking-normal opacity-70">
                  {d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" })}
                </div>
              </th>
            ))}
            <th className="px-3 py-2 text-center">Days</th>
            <th className="px-3 py-2 text-center">Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([taskName, byDay]) => {
            const doneDays = days.filter((d) => byDay.get(dayKey(d))).length;
            const hours = [...byDay.values()].reduce((n, c) => n + c.hours, 0);
            return (
              <tr key={taskName} className="border-b border-[var(--border-light)] last:border-0">
                <td className="px-4 py-2 font-bold text-[var(--text-primary)] sticky left-0 bg-[var(--bg-card)]">{taskName}</td>
                {days.map((d) => {
                  const cell = byDay.get(dayKey(d));
                  return (
                    <td key={d.toISOString()} className="px-2 py-2 text-center">
                      {cell ? (
                        <span
                          title={`${cell.hours} h · ${cell.entries.map((e) => `${e.timeFrom}-${e.timeTo}`).join(", ")}`}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600"
                        >
                          <Check size={13} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-red-500/10 text-red-500">
                          <X size={13} />
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-bold text-[var(--text-primary)]">{doneDays}/7</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{Math.round(hours * 100) / 100}</td>
              </tr>
            );
          })}
          <tr className="bg-[var(--bg-input)] text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            <td className="px-4 py-2 font-black sticky left-0 bg-[var(--bg-input)]">Entries that day</td>
            {perDay.map((n, i) => (
              <td key={i} className={`px-2 py-2 text-center font-black ${n ? "text-emerald-600" : "text-red-500"}`}>{n}</td>
            ))}
            <td className="px-3 py-2 text-center font-black text-[var(--text-primary)]">{report.tasks.length}</td>
            <td className="px-3 py-2 text-center font-black text-[var(--text-primary)]">{totalHours}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default function WeeklyWorkReportAdminPage() {
  const [mode, setMode] = useState("overall");
  const [facultyList, setFacultyList] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [weekOf, setWeekOf] = useState("");
  // The grid is what an admin reads at a glance; the list has every detail.
  const [view, setView] = useState("grid");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [mailing, setMailing] = useState(false);
  // The deadline every faculty member is held to, and when reports
  // auto-submit. Admin-configurable.
  const [schedule, setSchedule] = useState(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    api.get("/weekly-work-report/admin/schedule")
      .then(({ data }) => setSchedule(data.data))
      .catch(() => {});
  }, []);

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const { data } = await api.put("/weekly-work-report/admin/schedule", { day: schedule.day, time: schedule.time, emails: !!schedule.emails });
      setSchedule(data.data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSavingSchedule(false);
    }
  };

  useEffect(() => {
    api
      .get("/weekly-work-report/admin/faculty-list")
      .then(({ data }) => {
        if (data.success) setFacultyList(data.data);
      })
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (mode === "faculty" && facultyId) params.facultyId = facultyId;
      if (mode === "date" && weekOf) params.weekOf = weekOf;
      const { data } = await api.get("/weekly-work-report/admin/reports", { params });
      if (data.success) setReports(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load weekly reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, facultyId, weekOf]);

  const download = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (mode === "faculty" && facultyId) params.set("facultyId", facultyId);
      if (mode === "date" && weekOf) params.set("weekOf", weekOf);
      const qs = params.toString();
      await downloadFile(`/weekly-work-report/admin/reports/pdf${qs ? `?${qs}` : ""}`, "Weekly-Work-Report.pdf");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const sendMails = async () => {
    const friday = weekFriday(weekOf);
    if (!window.confirm(`Send the Weekly Work Report status mails for the week ending ${friday} to every faculty member and HOD?`)) return;
    setMailing(true);
    try {
      const { data } = await api.post("/weekly-work-report/admin/send-mails", { friday });
      const s = data.data;
      toast.success(`${s.sent} mail(s) sent · ${s.submitted} submitted, ${s.notSubmitted} not submitted${s.failed ? ` · ${s.failed} failed` : ""}`);
      if (s.errors?.length) s.errors.slice(0, 3).forEach((e) => toast.error(e, { duration: 8000 }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send mails");
    } finally {
      setMailing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
            <ClipboardList size={26} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Weekly Work Report</h1>
            <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Every faculty's Friday work report — filter by faculty, by date, or view everything.</p>
          </div>
        </div>
        <button onClick={download} disabled={downloading} className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto disabled:opacity-40">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
        </button>
      </header>

      {schedule && (
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--primary)]" />
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Submission Deadline</h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Faculty add their work through the week and submit on this day. At this exact time every report that has
            entries is <strong>submitted automatically</strong>. The status mail goes to that faculty member alone (Submitted /
            Not Submitted / Missing) and is a separate switch below — auto-submit works either way.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
              Day
              <select
                value={schedule.day}
                onChange={(e) => setSchedule((s) => ({ ...s, day: Number(e.target.value) }))}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {(schedule.days || []).map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
              Time (IST)
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>
            <button onClick={saveSchedule} disabled={savingSchedule} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
            </button>
            <span className="text-xs text-[var(--text-secondary)] pb-2">Currently: <strong className="text-[var(--text-primary)]">{schedule.label}</strong></span>
          </div>

          {/* Status mails are off unless this is turned on. */}
          <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer border-t border-[var(--border-light)] pt-3">
            <input
              type="checkbox"
              checked={!!schedule.emails}
              onChange={(e) => setSchedule((s) => ({ ...s, emails: e.target.checked }))}
              className="mt-0.5"
            />
            <span>
              <strong className="text-[var(--text-primary)]">Send status emails at the deadline</strong>
              <span className={`ml-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                schedule.emails
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)]"
              }`}>{schedule.emails ? "On" : "Off"}</span>
              <br />
              Off means nobody gets a mail — reports still submit automatically and everything stays visible on this page.
              Remember to press Save after changing this.
            </span>
          </label>
        </div>
      )}

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <div className="flex gap-2 flex-wrap">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === m.id ? "bg-[var(--primary)] text-white" : "border border-[var(--border-light)] text-[var(--text-primary)]"
              }`}
            >
              <m.icon size={14} /> {m.label}
            </button>
          ))}
        </div>

        {mode === "faculty" && (
          <select
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select faculty</option>
            {facultyList.map((f) => (
              <option key={f._id} value={f._id}>{f.name} — {f.email}</option>
            ))}
          </select>
        )}
        {mode === "date" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            />
            {weekOf && (
              <button
                onClick={sendMails}
                disabled={mailing || !schedule?.emails}
                title={schedule?.emails ? "" : "Status emails are switched off"}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40"
              >
                {mailing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send status mails (week ending {weekFriday(weekOf)})
              </button>
            )}
          </div>
        )}
        {mode === "date" && (
          <p className="text-[11px] text-[var(--text-secondary)]">
            {schedule?.emails
              ? "Status mails go out automatically at the deadline above. Use the button only if that run was missed — it mails every faculty and HOD again."
              : "Status emails are switched off, so nothing is mailed at the deadline. Turn the switch on above if you want them back."}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {[["all", "All faculty · one week"], ["grid", "Grid view"], ["list", "Detailed list"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border ${
              view === key
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "all" ? (
        <AllFacultyWeek weekOf={weekOf || ""} />
      ) : loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl">
          <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">No weekly reports found for these filters.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-light)] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">{r.faculty?.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{r.faculty?.email} · {r.faculty?.department}</div>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  Week of {new Date(r.weekOf).toLocaleDateString()}
                </span>
              </div>
              {view === "grid" ? <WeekMatrix report={r} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                      <th className="px-4 py-2">Task Name</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Hours</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.tasks.map((t) => (
                      <tr key={t._id} className="border-b border-[var(--border-light)] last:border-0">
                        <td className="px-4 py-2 font-bold text-[var(--text-primary)]">{t.taskName}</td>
                        <td className="px-4 py-2 text-[var(--text-secondary)]">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-[var(--text-secondary)]">{t.timeFrom}-{t.timeTo}</td>
                        <td className="px-4 py-2 text-[var(--text-secondary)]">{t.totalHours}</td>
                        <td className="px-4 py-2">
                          <span className={`badge ${STATUS_BADGE[t.status] || ""}`}>
                            {STATUS_OPTIONS.find((s) => s.value === t.status)?.label || t.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[var(--text-secondary)]">{t.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
