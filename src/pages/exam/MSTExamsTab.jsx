import { useState } from "react";
import { CalendarDays, CalendarPlus, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Modal, SemesterPicker } from "./mstShared";
import { dateText, errText, inputCls, labelCls } from "./mstUtils";

// The exams (MST-1 / MST-2), their allow rules and their date sheet.

const STATUS = {
  draft: ["Draft", "bg-slate-500/10 text-slate-600"],
  seated: ["Seating made", "bg-amber-500/10 text-amber-700"],
  published: ["Published", "bg-emerald-500/10 text-emerald-600"],
};
const blankPaper = (semester = "") => ({ date: "", startTime: "10:00", endTime: "11:30", semester, subjectName: "", subjectCode: "" });

function ExamForm({ exam, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    name: exam?.name || "MST-1", session: exam?.session || "", semesters: exam?.semesters || [],
    minAttendance: exam?.rules?.minAttendance ?? 60, requireFeesClear: exam?.rules?.requireFeesClear ?? true,
    invigilatorsPerRoom: exam?.invigilatorsPerRoom ?? 1,
    schedule: (exam?.schedule || []).map((p) => ({ ...p })),
  }));
  const [quick, setQuick] = useState({ date: "", startTime: "10:00", endTime: "11:30" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setPaper = (i, patch) => set("schedule", f.schedule.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  // One date and time for every chosen semester at once.
  const addSitting = () => {
    if (!quick.date) return toast.error("Choose the date");
    if (!f.semesters.length) return toast.error("Choose the semesters first");
    set("schedule", [...f.schedule, ...f.semesters.map((s) => ({ ...blankPaper(s), ...quick }))]);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        name: f.name, session: f.session, semesters: f.semesters, invigilatorsPerRoom: Number(f.invigilatorsPerRoom),
        rules: { minAttendance: Number(f.minAttendance), requireFeesClear: f.requireFeesClear },
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
          <label className={labelCls}>Minimum attendance %<input type="number" min="0" max="100" value={f.minAttendance} onChange={(e) => set("minAttendance", e.target.value)} className={inputCls} /></label>
          <label className={labelCls}>Invigilators per room<input type="number" min="1" max="5" value={f.invigilatorsPerRoom} onChange={(e) => set("invigilatorsPerRoom", e.target.value)} className={inputCls} /></label>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <SemesterPicker value={f.semesters} onChange={(v) => set("semesters", v)} label="Semesters in this exam" />
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] cursor-pointer pb-2">
            <input type="checkbox" checked={f.requireFeesClear} onChange={(e) => set("requireFeesClear", e.target.checked)} /> Fees must be clear (₹0 due)
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display font-black text-[var(--text-primary)]"><CalendarDays size={16} className="text-[var(--primary)]" /> Date sheet</div>
          <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-[var(--bg-input)]/60 border border-[var(--border-light)] p-3">
            <label className={labelCls}>Date<input id="sitting-date" type="date" value={quick.date} onChange={(e) => setQuick((q) => ({ ...q, date: e.target.value }))} className={inputCls} /></label>
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
                      <td className="px-1.5 py-1.5"><input type="date" value={p.date} onChange={(e) => setPaper(i, { date: e.target.value })} className={inputCls} aria-label={`Paper ${i + 1} date`} /></td>
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
                    <div className="text-xs text-[var(--text-secondary)]">Semesters {e.semesters.join(", ")} · attendance ≥ {e.rules.minAttendance}%{e.rules.requireFeesClear ? " · fees clear" : ""} · {e.invigilatorsPerRoom} invigilator/room</div>
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
