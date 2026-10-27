import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, Search, ShieldAlert, Users, Wallet, CalendarX } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { SemesterPicker, Stat } from "./mstShared";
import { download, errText, inputCls, labelCls, rupees } from "./mstUtils";

// The allowed list: attendance at or above the minimum and no fees due.
// A coordinator sees every student; a TG sees only their own (`mine`).
export default function MSTEligibilityTab({ exams = [], tgView = false }) {
  const [semesters, setSemesters] = useState([]);
  const [exam, setExam] = useState("");
  const [status, setStatus] = useState("");
  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const params = useCallback(() => ({
    ...(semesters.length ? { semester: semesters.join(",") } : {}), ...(exam ? { exam } : {}), ...(status ? { status } : {}),
    ...(batch ? { batch } : {}), ...(section ? { section } : {}), ...(query ? { q: query } : {}),
  }), [semesters, exam, status, batch, section, query]);

  useEffect(() => {
    let alive = true;
    api.get("/mst-exam/eligibility", { params: params() })
      .then(({ data: d }) => { if (alive) setData(d); })
      .catch((err) => { if (alive) { toast.error(errText(err, "Could not load")); setData({ data: [], summary: {} }); } });
    return () => { alive = false; };
  }, [params]);

  const exportXlsx = async () => {
    setBusy(true);
    try { await download("/mst-exam/eligibility/export", "MST_Allowed_Students.xlsx", params()); } catch { toast.error("Could not download"); } finally { setBusy(false); }
  };

  const rows = data?.data || [];
  const s = data?.summary || {};
  const rules = data?.rules;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={tgView ? "My TG students" : "Students"} value={s.total ?? "—"} icon={Users} tone="text-[var(--primary)] bg-[var(--primary)]/10" />
        <Stat label="Allowed" value={s.allowed ?? "—"} icon={CheckCircle2} tone="text-emerald-600 bg-emerald-500/10" />
        <Stat label="Short of attendance" value={s.attendance ?? "—"} icon={CalendarX} tone="text-amber-600 bg-amber-500/10" />
        <Stat label="Fees due" value={s.fees ?? "—"} icon={Wallet} tone="text-red-600 bg-red-500/10" />
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <SemesterPicker value={semesters} onChange={setSemesters} label="Semesters (none = all)" />
          {exams.length > 0 && (
            <label className={labelCls}>Rules of
              <select value={exam} onChange={(e) => setExam(e.target.value)} className={inputCls} aria-label="Exam">
                <option value="">Default (60%, fees clear)</option>
                {exams.map((x) => <option key={x._id} value={x._id}>{x.title}</option>)}
              </select>
            </label>
          )}
          <label className={labelCls}>Show
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} aria-label="Show">
              <option value="">Everyone</option><option value="allowed">Allowed only</option><option value="not">Not allowed only</option>
            </select>
          </label>
          <label className={labelCls}>Batch<input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. 2023-27" className={`${inputCls} w-28`} /></label>
          <label className={labelCls}>Section<input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" className={`${inputCls} w-16`} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or enrollment no" aria-label="Search students" className={`${inputCls} w-full pl-9`} />
          </div>
          {rules && <span className="text-xs text-[var(--text-secondary)]">Rule: attendance ≥ <b>{rules.minAttendance}%</b>{rules.requireFeesClear ? <> and <b>no fees due</b></> : ""}</span>}
          <button onClick={exportXlsx} disabled={busy} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Excel
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {!data ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
          : rows.length === 0 ? <div className="p-10 text-center text-sm text-[var(--text-secondary)]">{tgView ? "No TG students match." : "No students match."}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                    <th className="px-4 py-3">Student</th><th className="px-4 py-3">Sem / Batch</th><th className="px-4 py-3 text-right">Attendance</th>
                    <th className="px-4 py-3 text-right">Fees due</th><th className="px-4 py-3">Status</th>{!tgView && <th className="px-4 py-3">TG</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-[var(--border-light)] last:border-0">
                      <td className="px-4 py-2.5"><div className="font-bold text-[var(--text-primary)]">{r.name}</div><div className="text-[11px] font-mono text-[var(--text-secondary)]">{r.enrollmentNumber}</div></td>
                      <td className="px-4 py-2.5 text-xs">Sem {r.semester ?? "—"} · {r.batch || "—"}{r.section ? ` · ${r.section}` : ""}</td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${r.reasons.some((x) => x.startsWith("Attendance")) ? "text-amber-600" : "text-[var(--text-primary)]"}`}>{r.attendance}%</td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${r.duesFees > 0 ? "text-red-600" : "text-emerald-600"}`}>{r.duesFees > 0 ? rupees(r.duesFees) : "Clear"}</td>
                      <td className="px-4 py-2.5">
                        {r.allowed
                          ? <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 size={12} /> Allowed{r.override === true ? " (by coordinator)" : ""}</span>
                          : (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-600"><ShieldAlert size={12} /> Not allowed</span>
                              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.override === false ? r.overrideReason : r.reasons.join(" · ")}</div>
                            </div>
                          )}
                        {r.seat && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.seat.room} · {r.seat.label}{r.seat.status === "reserved" ? " (reserved)" : ""}</div>}
                      </td>
                      {!tgView && <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{r.tg || "—"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
