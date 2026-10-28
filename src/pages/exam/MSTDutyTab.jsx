import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, EyeOff, Loader2, Pencil, Save, Search, Shuffle, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Modal } from "./mstShared";
import { dateText, download, errText, inputCls } from "./mstUtils";

// Invigilation duty: for every sitting (date + time), every room in use gets
// its invigilators. Auto-share spreads the duties evenly; any room can be set
// by hand (those stay when auto runs again). Publishing tells the faculty.

function PickFaculty({ title, faculty, value, onSave, onClose, busyFaculty }) {
  const [picked, setPicked] = useState(value);
  const [q, setQ] = useState("");
  const shown = faculty.filter((f) => !q.trim() || `${f.name} ${f.department}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search faculty" aria-label="Search faculty" className={`${inputCls} w-full pl-8`} />
        </div>
        <div className="max-h-80 overflow-y-auto border border-[var(--border-light)] rounded-xl divide-y divide-[var(--border-light)]">
          {shown.map((f) => {
            const on = picked.includes(String(f._id));
            const busy = busyFaculty.has(String(f._id)) && !value.includes(String(f._id));
            return (
              <label key={f._id} className={`flex items-center gap-3 px-3 py-2 text-sm ${busy ? "opacity-50" : "cursor-pointer hover:bg-[var(--bg-input)]/60"}`}>
                <input type="checkbox" checked={on} disabled={busy} onChange={() => setPicked(on ? picked.filter((x) => x !== String(f._id)) : [...picked, String(f._id)])} />
                <span className="font-semibold text-[var(--text-primary)]">{f.name}</span>
                <span className="text-xs text-[var(--text-secondary)]">{f.department}</span>
                <span className="ml-auto text-[11px] text-[var(--text-secondary)]">{busy ? "busy at this time" : `${f.duties} duties`}</span>
              </label>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline-premium text-sm px-4 py-2">Cancel</button>
          <button onClick={() => onSave(picked)} className="btn-premium text-sm px-5 py-2 flex items-center gap-1.5"><Save size={14} /> Save</button>
        </div>
      </div>
    </Modal>
  );
}

export default function MSTDutyTab({ exams, examId, setExamId, reload: reloadExams }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState(null); // { session, room }
  const [exclude, setExclude] = useState([]);
  const [showPool, setShowPool] = useState(false);

  const load = useCallback(() => {
    if (!examId) return Promise.resolve();
    return api.get(`/mst-exam/exams/${examId}/duties`).then(({ data: d }) => setData(d)).catch((err) => toast.error(errText(err, "Could not load duties")));
  }, [examId]);
  useEffect(() => { load(); }, [load]);

  const act = async (key, fn) => {
    setBusy(key);
    try { const { data: d } = await fn(); toast.success(d.message, { duration: 6000 }); await load(); reloadExams?.(); } catch (err) { toast.error(errText(err, "Something went wrong")); } finally { setBusy(""); }
  };
  const busyAt = useMemo(() => {
    if (!editing) return new Set();
    return new Set(editing.session.rooms.filter((r) => r.id !== editing.room.id).flatMap((r) => r.faculty.map((f) => String(f._id))));
  }, [editing]);

  if (!exams.length) return <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">Create an exam first (Exams &amp; Dates).</div>;
  const exam = data?.exam;
  const totalRooms = (data?.sessions || []).reduce((n, s) => n + s.rooms.length, 0);
  const filled = (data?.sessions || []).reduce((n, s) => n + s.rooms.filter((r) => r.faculty.length >= (exam?.invigilatorsPerRoom || 1)).length, 0);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-2">
        <select value={examId} onChange={(e) => { setExamId(e.target.value); setData(null); }} className={inputCls} aria-label="Exam">
          {exams.map((x) => <option key={x._id} value={x._id}>{x.title}</option>)}
        </select>
        {exam && <span className="text-xs text-[var(--text-secondary)]">{exam.invigilatorsPerRoom} invigilator(s) per room · {filled}/{totalRooms} room-sittings covered</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => setShowPool(!showPool)} className="btn-outline-premium text-xs px-3 py-2">Faculty pool ({(data?.faculty.length || 0) - exclude.length})</button>
          <button id="duty-auto" onClick={() => act("auto", () => api.post(`/mst-exam/exams/${examId}/duties/auto`, { exclude }))} disabled={!!busy} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {busy === "auto" ? <Loader2 size={13} className="animate-spin" /> : <Shuffle size={13} />} Auto-assign duties
          </button>
          {exam && (
            <button id="duty-publish" onClick={() => act("pub", () => api.post(`/mst-exam/exams/${examId}/publish`, { duties: !exam.dutiesPublished }))} disabled={!!busy} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
              {exam.dutiesPublished ? <EyeOff size={13} /> : <Eye size={13} />} {exam.dutiesPublished ? "Hide from faculty" : "Publish to faculty"}
            </button>
          )}
          <button onClick={() => download(`/mst-exam/exams/${examId}/export/duties`, "Duty.xlsx").catch(() => toast.error("Could not download"))} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><Download size={13} /> Excel</button>
        </div>
      </div>

      {showPool && data && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">Untick faculty who should get no duty (on leave, exam cell …). Auto-assign uses the rest; duties set by hand are kept.</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-1.5 max-h-64 overflow-y-auto">
            {data.faculty.map((f) => {
              const on = !exclude.includes(String(f._id));
              return (
                <label key={f._id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-[var(--bg-input)]/60 cursor-pointer">
                  <input type="checkbox" checked={on} onChange={() => setExclude(on ? [...exclude, String(f._id)] : exclude.filter((x) => x !== String(f._id)))} />
                  <span className="truncate">{f.name}</span><span className="ml-auto text-[var(--text-secondary)]">{f.duties}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {!data ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        : data.sessions.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">Add the date sheet to the exam first.</div>
          : totalRooms === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">Make the seating plan first — duties follow the rooms in use.</div> : (
            <div className="space-y-3">
              {data.sessions.map((s) => (
                <div key={s.key} className="glass-card rounded-2xl p-4 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-display font-black text-[var(--text-primary)]">{dateText(s.date)}</span>
                    <span className="text-sm font-semibold text-[var(--primary)]">{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{s.papers.map((p) => `Sem ${p.semester}${p.subjectName ? `: ${p.subjectName}` : ""}`).join(" · ")}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {s.rooms.map((room) => {
                      const short = room.faculty.length < (exam.invigilatorsPerRoom || 1);
                      return (
                        <div key={room.id} className={`rounded-xl border px-3 py-2 flex items-start gap-2 ${short ? "border-amber-500/50 bg-amber-500/5" : "border-[var(--border-light)]"}`}>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-[var(--text-primary)]">Room {room.name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              {room.faculty.length ? room.faculty.map((f) => <span key={f._id} className="inline-flex items-center gap-1 mr-2"><UserCheck size={11} className={f.manual ? "text-[var(--primary)]" : "text-emerald-600"} />{f.name}</span>) : <span className="text-amber-700 font-semibold">No invigilator</span>}
                            </div>
                          </div>
                          <button onClick={() => setEditing({ session: s, room })} aria-label={`Set invigilators for room ${room.name} on ${s.date} ${s.startTime}`} className="p-1.5 rounded-lg border border-[var(--border-light)] hover:text-[var(--primary)]"><Pencil size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

      {editing && (
        <PickFaculty title={`Room ${editing.room.name} — ${dateText(editing.session.date)} ${editing.session.startTime}`} faculty={data.faculty}
          value={editing.room.faculty.map((f) => String(f._id))} busyFaculty={busyAt} onClose={() => setEditing(null)}
          onSave={(ids) => { const e = editing; setEditing(null); act("set", () => api.put(`/mst-exam/exams/${examId}/duties`, { date: e.session.date, startTime: e.session.startTime, room: e.room.id, faculty: ids })); }} />
      )}
    </div>
  );
}
