import { useCallback, useEffect, useState } from "react";
import { Check, CheckCircle2, Download, Loader2, Pencil, RotateCcw, Search, ShieldAlert, ShieldCheck, Users, Wallet, CalendarX, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { SemesterPicker, Stat } from "./mstShared";
import { download, errText, inputCls, labelCls, rupees } from "./mstUtils";

// The allowed list: attendance at or above the minimum (the exam's, or the
// semester's own) and no fees due. A coordinator sees every student and, with
// an exam chosen (the latest one, to start with), can allow or stop anyone by
// hand (with a reason); a TG sees only their own students (`mine`). Both can
// correct a student's due fees here — it goes into the fees history.
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
  const [acting, setActing] = useState("");
  const [tick, setTick] = useState(0);
  const [feeEdit, setFeeEdit] = useState(null); // { id, amount, note }

  // A coordinator starts on the latest exam, so Allow / Not allow are there
  // at once; choosing "Default" afterwards is kept.
  const [examPicked, setExamPicked] = useState(false);
  if (!tgView && !examPicked && exams.length) {
    setExamPicked(true);
    setExam(exams[0]._id);
  }

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
  }, [params, tick]);

  // allowed: true (allow), false (stop) or null (let the rules decide again).
  const decide = async (r, allowed) => {
    let reason = "";
    if (allowed !== null) {
      reason = window.prompt(allowed ? `Allow ${r.name} — reason (kept in the record):` : `Not allow ${r.name} — reason (the student sees it):`) ?? null;
      if (reason === null) return;
      if (allowed !== r.autoAllowed && !reason.trim()) return toast.error("A reason is needed");
    }
    setActing(r._id);
    try {
      const { data: d } = await api.patch(`/mst-exam/exams/${exam}/students/${r._id}/allow`, { allowed, reason });
      toast.success(d.message);
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(errText(err, "Could not save"));
    } finally {
      setActing("");
    }
  };
  const canDecide = !tgView && !!exam;

  const saveFees = async () => {
    const amount = String(feeEdit.amount).trim();
    if (amount === "" || Number.isNaN(Number(amount)) || Number(amount) < 0) return toast.error("Enter the due fees (₹0 or more)");
    if (!feeEdit.note.trim()) return toast.error("Write a note — e.g. receipt no.");
    setActing(`fee-${feeEdit.id}`);
    try {
      const { data: d } = await api.patch(`/mst-exam/students/${feeEdit.id}/fees`, { duesFees: Number(amount), note: feeEdit.note.trim() });
      toast.success(d.message);
      setFeeEdit(null);
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(errText(err, "Could not save the fees"));
    } finally {
      setActing("");
    }
  };

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
                <option value="">Default (60%, fees clear) — no exam</option>
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
          {rules && (
            <span className="text-xs text-[var(--text-secondary)]">
              Rule: attendance ≥ <b>{rules.minAttendance}%</b>{rules.requireFeesClear ? <> and <b>no fees due</b></> : ""}
              {(rules.bySemester || []).map((x) => <span key={x.semester}> · Sem {x.semester}: ≥ <b>{x.minAttendance}%</b>{x.requireFeesClear === false ? " (fees not checked)" : ""}</span>)}
            </span>
          )}
          <button onClick={exportXlsx} disabled={busy} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Excel
          </button>
        </div>
        {!tgView && !exam && exams.length > 0 && (
          <p className="text-[11px] text-[var(--text-secondary)]">To allow or stop a student by hand, choose the exam under &ldquo;Rules of&rdquo;.</p>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {!data ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
          : rows.length === 0 ? <div className="p-10 text-center text-sm text-[var(--text-secondary)]">{tgView ? "No TG students match." : "No students match."}</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                    <th className="px-4 py-3">Student</th><th className="px-4 py-3">Sem / Batch</th><th className="px-4 py-3 text-right">Attendance</th>
                    <th className="px-4 py-3 text-right">Fees due</th><th className="px-4 py-3">Status</th>{!tgView && <th className="px-4 py-3">TG</th>}{canDecide && <th className="px-4 py-3">Allow by hand</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-b border-[var(--border-light)] last:border-0">
                      <td className="px-4 py-2.5"><div className="font-bold text-[var(--text-primary)]">{r.name}</div><div className="text-[11px] font-mono text-[var(--text-secondary)]">{r.enrollmentNumber}</div></td>
                      <td className="px-4 py-2.5 text-xs">Sem {r.semester ?? "—"} · {r.batch || "—"}{r.section ? ` · ${r.section}` : ""}</td>
                      <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${r.reasons.some((x) => x.startsWith("Attendance")) ? "text-amber-600" : "text-[var(--text-primary)]"}`}>
                        {r.attendance}%<div className="text-[10px] font-normal text-[var(--text-secondary)]">needs {r.minAttendance}%</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {feeEdit?.id === r._id ? (
                          <div className="flex flex-col items-end gap-1.5 min-w-[170px]">
                            <input type="number" min="0" autoFocus value={feeEdit.amount} onChange={(e) => setFeeEdit((f) => ({ ...f, amount: e.target.value }))}
                              aria-label={`Due fees for ${r.name}`} className={`${inputCls} w-32 text-right`} />
                            <input value={feeEdit.note} onChange={(e) => setFeeEdit((f) => ({ ...f, note: e.target.value }))} placeholder="Note / receipt no."
                              aria-label={`Fees note for ${r.name}`} onKeyDown={(e) => { if (e.key === "Enter") saveFees(); if (e.key === "Escape") setFeeEdit(null); }} className={`${inputCls} w-full text-xs`} />
                            <div className="flex gap-1">
                              <button onClick={saveFees} disabled={acting === `fee-${r._id}`} aria-label={`Save fees for ${r.name}`} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 disabled:opacity-50">
                                {acting === `fee-${r._id}` ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              </button>
                              <button onClick={() => setFeeEdit(null)} aria-label="Cancel" className="p-1.5 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)]"><X size={13} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={`font-bold tabular-nums ${r.duesFees > 0 ? "text-red-600" : "text-emerald-600"}`}>{r.duesFees > 0 ? rupees(r.duesFees) : "Clear"}</span>
                            <button onClick={() => setFeeEdit({ id: r._id, amount: String(r.duesFees || 0), note: "" })} aria-label={`Edit fees of ${r.name}`} title="Edit due fees"
                              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"><Pencil size={12} /></button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {r.allowed
                          ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 size={12} /> Allowed{r.override === true ? " (by coordinator)" : ""}</span>
                              {r.override === true && r.overrideReason && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.overrideReason}</div>}
                            </div>
                          )
                          : (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-600"><ShieldAlert size={12} /> Not allowed{r.override === false ? " (by coordinator)" : ""}</span>
                              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.override === false ? r.overrideReason : r.reasons.join(" · ")}</div>
                            </div>
                          )}
                        {r.seat && <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.seat.room} · {r.seat.label}{r.seat.status === "reserved" ? " (reserved)" : ""}</div>}
                      </td>
                      {!tgView && <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{r.tg || "—"}</td>}
                      {canDecide && (
                        <td className="px-4 py-2.5">
                          {r.inExam === false ? <span className="text-[11px] text-[var(--text-secondary)]">Semester not in this exam</span> : (
                            <div className="flex flex-wrap gap-1.5">
                              {acting === r._id ? <Loader2 size={14} className="animate-spin text-[var(--primary)]" /> : (<>
                                {!r.allowed && <button onClick={() => decide(r, true)} aria-label={`Allow ${r.name}`} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center gap-1"><ShieldCheck size={12} /> Allow</button>}
                                {r.allowed && <button onClick={() => decide(r, false)} aria-label={`Not allow ${r.name}`} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 flex items-center gap-1"><ShieldAlert size={12} /> Not allow</button>}
                                {r.override !== null && <button onClick={() => decide(r, null)} aria-label={`Reset ${r.name}`} title="Let the rules decide again" className="text-[11px] font-bold px-2 py-1.5 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] flex items-center gap-1"><RotateCcw size={12} /> By rules</button>}
                              </>)}
                            </div>
                          )}
                        </td>
                      )}
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
