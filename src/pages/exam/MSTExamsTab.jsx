import { useState } from "react";
import { CalendarDays, CalendarPlus, CalendarRange, Loader2, Pencil, Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Modal, SemesterPicker } from "./mstShared";
import { dateText, errText, inputCls, labelCls } from "./mstUtils";

// The exams (MST-1 / MST-2): their dates (from – to), their allow rules —
// one general rule, and any semester that needs its own — and the date sheet.

const STATUS = {
  draft: ["Draft", "bg-slate-500/10 text-slate-600"],
  seated: ["Seating made", "bg-amber-500/10 text-amber-700"],
  published: ["Published", "bg-emerald-500/10 text-emerald-600"],
};
const blankPaper = (semester = "") => ({ date: "", startTime: "10:00", endTime: "11:30", semester, subjectName: "", subjectCode: "" });

function ExamForm({ exam, onClose, onSaved }) {
  const [f, setF] = useState(() => {
    const dates = (exam?.schedule || []).map((p) => p.date).sort();
    return {
      name: exam?.name || "MST-1", session: exam?.session || "", semesters: exam?.semesters || [],
      // An exam made before dates were asked for starts from its date sheet.
      startDate: exam?.startDate || dates[0] || "", endDate: exam?.endDate || dates[dates.length - 1] || "",
      minAttendance: exam?.rules?.minAttendance ?? 60, requireFeesClear: exam?.rules?.requireFeesClear ?? true,
      // semester → { minAttendance, requireFeesClear }; a semester not here follows the general rule.
      bySemester: Object.fromEntries((exam?.rules?.bySemester || []).map((x) => [x.semester, { minAttendance: x.minAttendance, requireFeesClear: x.requireFeesClear !== false }])),
      invigilatorsPerRoom: exam?.invigilatorsPerRoom ?? 1,
      schedule: (exam?.schedule || []).map((p) => ({ ...p })),
    };
  });
  const [quick, setQuick] = useState({ date: "", startTime: "10:00", endTime: "11:30" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setPaper = (i, patch) => set("schedule", f.schedule.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  const setSemRule = (sem, patch) => set("bySemester", { ...f.bySemester, [sem]: { minAttendance: f.minAttendance, requireFeesClear: f.requireFeesClear, ...f.bySemester[sem], ...patch } });
  const clearSemRule = (sem) => { const next = { ...f.bySemester }; delete next[sem]; set("bySemester", next); };
  const outside = (d) => d && f.startDate && f.endDate && (d < f.startDate || d > f.endDate);
  // One date and time for every chosen semester at once.
  const addSitting = () => {
    if (!quick.date) return toast.error("Choose the date");
    if (outside(quick.date)) return toast.error(`The date must be between ${dateText(f.startDate)} and ${dateText(f.endDate)}`);
    if (!f.semesters.length) return toast.error("Choose the semesters first");
    set("schedule", [...f.schedule, ...f.semesters.map((s) => ({ ...blankPaper(s), ...quick }))]);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!f.startDate || !f.endDate) return toast.error("Give the exam dates — from and to");
    if (f.schedule.some((p) => outside(p.date))) return toast.error("A paper is outside the exam dates — fix the red dates");
    setBusy(true);
    try {
      const body = {
        name: f.name, session: f.session, semesters: f.semesters, invigilatorsPerRoom: Number(f.invigilatorsPerRoom),
        startDate: f.startDate, endDate: f.endDate,
        rules: {
          minAttendance: Number(f.minAttendance), requireFeesClear: f.requireFeesClear,
          bySemester: f.semesters.filter((s) => f.bySemester[s]).map((s) => ({ semester: s, minAttendance: Number(f.bySemester[s].minAttendance), requireFeesClear: f.bySemester[s].requireFeesClear })),
        },
        schedule: f.schedule.map((p) => ({ ...p, semester: Number(p.semester) })),
      };
      const { data } = exam ? await api.put(`/mst-exam/exams/${exam._id}`, body) : await api.post("/mst-exam/exams", body);
      toast.success(data.message);
      onSaved(data.data);
    } catch (err) {
      toast.error(errText(err, "Could not save"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={exam ? `Edit — ${exam.title}` : "Create exam"} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-5">
        <div className="grid sm:grid-cols-4 gap-3">
          <label className={labelCls}>Exam
            <select id="exam-name" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls}><option>MST-1</option><option>MST-2</option></select>
          </label>
          <label className={labelCls}>Session<input id="exam-session" value={f.session} onChange={(e) => set("session", e.target.value)} placeholder="e.g. 2026-27 Odd" className={inputCls} /></label>
          <label className={labelCls}>Exam from<input id="exam-from" type="date" required value={f.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} /></label>
          <label className={labelCls}>Exam to<input id="exam-to" type="date" required min={f.startDate || undefined} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} /></label>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <label className={labelCls}>Minimum attendance % (all)<input id="exam-min-att" type="number" min="0" max="100" value={f.minAttendance} onChange={(e) => set("minAttendance", e.target.value)} className={inputCls} /></label>
          <label className={labelCls}>Invigilators per room<input type="number" min="1" max="5" value={f.invigilatorsPerRoom} onChange={(e) => set("invigilatorsPerRoom", e.target.value)} className={inputCls} /></label>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <SemesterPicker value={f.semesters} onChange={(v) => set("semesters", v)} label="Semesters in this exam" />
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] cursor-pointer pb-2">
            <input type="checkbox" checked={f.requireFeesClear} onChange={(e) => set("requireFeesClear", e.target.checked)} /> Fees must be clear (₹0 due)
          </label>
        </div>

        {f.semesters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-display font-black text-[var(--text-primary)]"><SlidersHorizontal size={16} className="text-[var(--primary)]" /> Rules for each semester</div>
            <p className="text-xs text-[var(--text-secondary)]">A semester on &ldquo;Same as all&rdquo; follows the rule above. Give a semester its own rule where it differs.</p>
            <div className="overflow-x-auto border border-[var(--border-light)] rounded-2xl">
              <table className="w-full text-xs min-w-[560px]">
                <thead><tr className="text-left text-[10px] uppercase text-[var(--text-secondary)]">
                  <th className="px-3 py-2">Semester</th><th className="px-3 py-2">Rule</th><th className="px-3 py-2">Minimum attendance %</th><th className="px-3 py-2">Fees must be clear</th>
                </tr></thead>
                <tbody>
                  {f.semesters.map((sem) => {
                    const own = f.bySemester[sem];
                    return (
                      <tr key={sem} className="border-t border-[var(--border-light)]">
                        <td className="px-3 py-2 font-black text-[var(--text-primary)]">Sem {sem}</td>
                        <td className="px-3 py-2">
                          <select value={own ? "own" : "all"} onChange={(e) => (e.target.value === "own" ? setSemRule(sem, {}) : clearSemRule(sem))} className={inputCls} aria-label={`Semester ${sem} rule`}>
                            <option value="all">Same as all</option><option value="own">Own rule</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {own
                            ? <input type="number" min="0" max="100" value={own.minAttendance} onChange={(e) => setSemRule(sem, { minAttendance: e.target.value })} className={`${inputCls} w-24`} aria-label={`Semester ${sem} minimum attendance`} />
                            : <span className="text-[var(--text-secondary)]">{f.minAttendance}%</span>}
                        </td>
                        <td className="px-3 py-2">
                          {own
                            ? <input type="checkbox" checked={own.requireFeesClear} onChange={(e) => setSemRule(sem, { requireFeesClear: e.target.checked })} aria-label={`Semester ${sem} fees must be clear`} />
                            : <span className="text-[var(--text-secondary)]">{f.requireFeesClear ? "Yes" : "No"}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display font-black text-[var(--text-primary)]"><CalendarDays size={16} className="text-[var(--primary)]" /> Date sheet</div>
          <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-[var(--bg-input)]/60 border border-[var(--border-light)] p-3">
            <label className={labelCls}>Date<input id="sitting-date" type="date" min={f.startDate || undefined} max={f.endDate || undefined} value={quick.date} onChange={(e) => setQuick((q) => ({ ...q, date: e.target.value }))} className={inputCls} /></label>
            <label className={labelCls}>From<input type="time" value={quick.startTime} onChange={(e) => setQuick((q) => ({ ...q, startTime: e.target.value }))} className={inputCls} /></label>
            <label className={labelCls}>To<input type="time" value={quick.endTime} onChange={(e) => setQuick((q) => ({ ...q, endTime: e.target.value }))} className={inputCls} /></label>
            <button id="sitting-add" type="button" onClick={addSitting} className="btn-outline-premium text-xs px-3 py-2.5 flex items-center gap-1.5"><CalendarPlus size={14} /> Add this sitting for every semester</button>
            <button type="button" onClick={() => set("schedule", [...f.schedule, blankPaper(f.semesters[0] || "")])} className="btn-outline-premium text-xs px-3 py-2.5 flex items-center gap-1.5"><Plus size={14} /> One paper</button>
          </div>
          {f.schedule.length === 0 ? <p className="text-xs text-[var(--text-secondary)]">No papers yet. Add a sitting (date + time) — then write each semester&apos;s subject.</p> : (
            <div className="overflow-x-auto border border-[var(--border-light)] rounded-2xl">
              <table className="w-full text-xs min-w-[760px]">
                <thead><tr className="text-left text-[10px] uppercase text-[var(--text-secondary)]">
                  <th className="px-2 py-2">Date</th><th className="px-2 py-2">From</th><th className="px-2 py-2">To</th><th className="px-2 py-2">Sem</th><th className="px-2 py-2">Subject</th><th className="px-2 py-2">Code</th><th />
                </tr></thead>
                <tbody>
                  {f.schedule.map((p, i) => (
                    <tr key={i} className="border-t border-[var(--border-light)]">
                      <td className="px-1.5 py-1.5"><input type="date" min={f.startDate || undefined} max={f.endDate || undefined} value={p.date} onChange={(e) => setPaper(i, { date: e.target.value })} className={`${inputCls} ${outside(p.date) ? "!border-red-500 text-red-600" : ""}`} aria-label={`Paper ${i + 1} date`} /></td>
                      <td className="px-1.5 py-1.5"><input type="time" value={p.startTime} onChange={(e) => setPaper(i, { startTime: e.target.value })} className={inputCls} aria-label={`Paper ${i + 1} from`} /></td>
                      <td className="px-1.5 py-1.5"><input type="time" value={p.endTime} onChange={(e) => setPaper(i, { endTime: e.target.value })} className={inputCls} aria-label={`Paper ${i + 1} to`} /></td>
                      <td className="px-1.5 py-1.5">
                        <select value={p.semester} onChange={(e) => setPaper(i, { semester: e.target.value })} className={inputCls} aria-label={`Paper ${i + 1} semester`}>
                          <option value="">—</option>{f.semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-1.5 py-1.5"><input value={p.subjectName} onChange={(e) => setPaper(i, { subjectName: e.target.value })} placeholder="Subject" className={`${inputCls} w-full`} aria-label={`Paper ${i + 1} subject`} /></td>
                      <td className="px-1.5 py-1.5"><input value={p.subjectCode} onChange={(e) => setPaper(i, { subjectCode: e.target.value })} placeholder="Code" className={`${inputCls} w-24`} aria-label={`Paper ${i + 1} code`} /></td>
                      <td className="px-1.5 py-1.5"><button type="button" onClick={() => set("schedule", f.schedule.filter((_, n) => n !== i))} aria-label={`Remove paper ${i + 1}`} className="p-2 text-red-500"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-outline-premium text-sm px-4 py-2">Cancel</button>
          <button id="exam-save" type="submit" disabled={busy} className="btn-premium text-sm px-5 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {exam ? "Save" : "Create exam"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MSTExamsTab({ exams, reload, onOpen }) {
  const [editing, setEditing] = useState(null);
  const remove = async (exam) => {
    if (!window.confirm(`Delete ${exam.title} with its seating plan and duties?`)) return;
    try { const { data } = await api.delete(`/mst-exam/exams/${exam._id}`); toast.success(data.message); reload(); } catch (err) { toast.error(errText(err, "Could not delete")); }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button id="exam-new" onClick={() => setEditing("new")} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5"><Plus size={15} /> Create exam</button></div>
      {exams.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">No exam yet — create MST-1 with its date sheet.</div> : (
        <div className="grid lg:grid-cols-2 gap-4">
          {exams.map((e) => {
            const [label, tone] = STATUS[e.status] || STATUS.draft;
            return (
              <div key={e._id} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-black text-xl text-[var(--text-primary)]">{e.title}</div>
                    {e.startDate && <div className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 mt-0.5"><CalendarRange size={12} /> {dateText(e.startDate)} – {dateText(e.endDate)}</div>}
                    <div className="text-xs text-[var(--text-secondary)]">Semesters {e.semesters.join(", ")} · attendance ≥ {e.rules.minAttendance}%{e.rules.requireFeesClear ? " · fees clear" : ""} · {e.invigilatorsPerRoom} invigilator/room</div>
                    {(e.rules.bySemester || []).length > 0 && (
                      <div className="text-[11px] text-[var(--text-secondary)]">Own rules: {e.rules.bySemester.map((x) => `Sem ${x.semester} ≥ ${x.minAttendance}%${x.requireFeesClear === false ? " (fees not checked)" : ""}`).join(" · ")}</div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${tone}`}>{label}</span>
                </div>
                <div className="space-y-1">
                  {e.sessions.length === 0 ? <div className="text-xs text-amber-600">No date sheet yet</div> : e.sessions.map((s) => (
                    <div key={s.key} className="text-xs flex flex-wrap gap-x-3 px-3 py-1.5 rounded-xl bg-[var(--bg-input)]/60">
                      <b className="text-[var(--text-primary)]">{dateText(s.date)}</b><span>{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>
                      <span className="text-[var(--text-secondary)]">{s.papers.map((p) => `Sem ${p.semester}${p.subjectName ? `: ${p.subjectName}` : ""}`).join(" · ")}</span>
                    </div>
                  ))}
                </div>
                {e.counts && <div className="text-xs text-[var(--text-secondary)]">{e.counts.allowed} allowed · {e.counts.notAllowed} not allowed · {e.counts.occupied} seated · {e.counts.reserved} reserved</div>}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onOpen(e._id, "seating")} className="btn-premium text-xs px-3 py-2">Seating plan</button>
                  <button onClick={() => onOpen(e._id, "duty")} className="btn-outline-premium text-xs px-3 py-2">Invigilation duty</button>
                  <button onClick={() => setEditing(e)} aria-label={`Edit ${e.title}`} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1"><Pencil size={12} /> Edit</button>
                  <button onClick={() => remove(e)} aria-label={`Delete ${e.title}`} className="ml-auto p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editing && <ExamForm exam={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}
