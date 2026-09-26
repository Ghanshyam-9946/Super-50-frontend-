import { useState, useEffect } from "react";
import { ClipboardList, Loader2, Download, Users, Calendar, LayoutGrid, Mail, Clock, Save } from "lucide-react";
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

export default function WeeklyWorkReportAdminPage() {
  const [mode, setMode] = useState("overall");
  const [facultyList, setFacultyList] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [weekOf, setWeekOf] = useState("");
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
      const { data } = await api.put("/weekly-work-report/admin/schedule", { day: schedule.day, time: schedule.time });
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
            entries is <strong>submitted automatically</strong>, and the status mails go to each faculty member and the HOD.
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
              <button onClick={sendMails} disabled={mailing} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
                {mailing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send status mails (week ending {weekFriday(weekOf)})
              </button>
            )}
          </div>
        )}
        {mode === "date" && (
          <p className="text-[11px] text-[var(--text-secondary)]">
            Status mails go out automatically at the deadline above. Use the button only if that run was missed — it mails every faculty and HOD again.
          </p>
        )}
      </div>

      {loading ? (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
