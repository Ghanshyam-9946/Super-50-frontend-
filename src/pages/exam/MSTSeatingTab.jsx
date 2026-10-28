import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, EyeOff, FileText, LayoutGrid, List, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck, Sparkles, Undo2, Users, Armchair } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { DecisionModal, Stat } from "./mstShared";
import { dateText, download, errText, inputCls, rupees } from "./mstUtils";

// The seating plan of one exam: make it, see each room as a grid (click a
// student, then a seat, to move or swap), allow or stop a student by hand,
// publish it to the students, and download the charts and sheets.

const SEAT_TONE = {
  occupied: "bg-emerald-500/12 border-emerald-500/40",
  reserved: "bg-amber-500/12 border-amber-500/40 border-dashed",
};
const SEM_TONE = ["text-indigo-600", "text-pink-600", "text-teal-600", "text-orange-600", "text-sky-600", "text-purple-600", "text-lime-700", "text-rose-600"];

function RoomGrid({ room, selected, onSeat }) {
  const at = (r, c, side) => room.seats.find((s) => s.r === r && s.c === c && s.side === side);
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-display font-black text-lg text-[var(--text-primary)]">Room {room.name}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">{room.occupied} seated · {room.reserved} reserved · {room.capacity} seats</div>
        </div>
        <div className="flex gap-1.5">{room.actions}</div>
      </div>
      <div className="mx-auto w-40 text-center text-[9px] font-black uppercase tracking-widest rounded-md bg-[var(--bg-input)] py-1 text-[var(--text-secondary)]">Front / Board</div>
      <div className="overflow-x-auto">
        <div className="grid gap-1.5 min-w-[520px]" style={{ gridTemplateColumns: `repeat(${room.cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: room.rows * room.cols }, (_, i) => {
            const r = Math.floor(i / room.cols); const c = i % room.cols;
            const b = room.layout.find((x) => x.r === r && x.c === c) || { type: "none" };
            if (b.type === "none") return <div key={i} className="h-14 rounded-lg border border-dashed border-[var(--border-light)]" />;
            const sides = b.type === "double" ? ["L", "R"] : ["S"];
            return (
              <div key={i} className="h-14 rounded-lg border border-[var(--border-light)] flex overflow-hidden" title={`Row ${r + 1}, Bench ${c + 1}`}>
                {sides.map((side) => {
                  const s = at(r, c, side);
                  const isSel = selected && s && selected._id === s._id;
                  return (
                    <button key={side} type="button" onClick={() => onSeat(room, r, c, side, s)}
                      className={`flex-1 flex flex-col items-center justify-center px-0.5 border-l first:border-l-0 border-[var(--border-light)] transition-colors ${s ? SEAT_TONE[s.status] : "hover:bg-[var(--primary)]/5"} ${isSel ? "ring-2 ring-[var(--primary)] ring-inset" : ""} ${selected && !s ? "bg-[var(--primary)]/5" : ""}`}
                      aria-label={s ? `${s.enrollmentNumber}, row ${r + 1} bench ${c + 1}` : `Empty seat row ${r + 1} bench ${c + 1}`}>
                      {s ? (
                        <>
                          <span className="text-[9px] font-black font-mono text-[var(--text-primary)] truncate max-w-full">{s.enrollmentNumber}</span>
                          <span className={`text-[9px] font-bold ${SEM_TONE[(s.semester || 1) - 1]}`}>Sem {s.semester}{s.status === "reserved" ? " · R" : ""}</span>
                        </>
                      ) : <span className="text-[9px] text-[var(--text-secondary)]">empty</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MSTSeatingTab({ exams, examId, setExamId, reload: reloadExams }) {
  const [data, setData] = useState(null);
  const [view, setView] = useState("rooms");
  const [busy, setBusy] = useState("");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    if (!examId) return Promise.resolve();
    return api.get(`/mst-exam/exams/${examId}/seating`).then(({ data: d }) => setData(d)).catch((err) => toast.error(errText(err, "Could not load the seating")));
  }, [examId]);
  useEffect(() => { load(); }, [load]);

  const act = async (key, fn) => {
    setBusy(key);
    try {
      const { data: d } = await fn();
      toast.success(d.message, { duration: 6000 });
      await load();
      reloadExams?.();
    } catch (err) {
      toast.error(errText(err, "Something went wrong"));
    } finally {
      setBusy("");
    }
  };
  const generate = () => {
    if (data?.exam?.status !== "draft" && !window.confirm("Make the seating plan again? Every seat is worked out afresh (coordinator decisions are kept).")) return;
    act("gen", () => api.post(`/mst-exam/exams/${examId}/seating`, {}));
  };
  // Allow / Not allow opens the comment box; clearing a decision does not.
  const [deciding, setDeciding] = useState(null); // { e, allowed }
  const decide = (e, allowed, reason = "") => {
    if (allowed !== null && !reason) return setDeciding({ e, allowed });
    setDeciding(null);
    return act(`d-${e._id}`, () => api.patch(`/mst-exam/exams/${examId}/entries/${e._id}/allow`, { allowed, reason }));
  };
  const onSeat = (room, r, c, side, s) => {
    if (!selected) { if (s) setSelected(s); return; }
    if (s && s._id === selected._id) { setSelected(null); return; }
    const who = selected;
    setSelected(null);
    act("move", () => api.patch(`/mst-exam/exams/${examId}/entries/${who._id}/seat`, { room: room._id, r, c, side }));
  };
  const file = (url, name, params) => download(url, name, params).catch(() => toast.error("Could not download"));

  const entries = useMemo(() => {
    let list = data?.entries || [];
    if (filter === "allowed") list = list.filter((e) => e.allowed);
    if (filter === "not") list = list.filter((e) => !e.allowed);
    if (filter === "noseat") list = list.filter((e) => e.seatStatus === "none");
    if (filter === "override") list = list.filter((e) => e.override?.allowed !== null && e.override?.allowed !== undefined);
    const t = q.trim().toLowerCase();
    if (t) list = list.filter((e) => `${e.name} ${e.enrollmentNumber}`.toLowerCase().includes(t));
    return list;
  }, [data, filter, q]);

  if (!exams.length) return <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">Create an exam first (Exams &amp; Dates).</div>;
  const exam = data?.exam;
  const all = data?.entries || [];
  const stats = {
    total: all.length, allowed: all.filter((e) => e.allowed).length, seated: all.filter((e) => e.seatStatus === "occupied").length,
    reserved: all.filter((e) => e.seatStatus === "reserved").length, none: all.filter((e) => e.seatStatus === "none").length,
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-2">
        <select value={examId} onChange={(e) => { setExamId(e.target.value); setData(null); }} className={inputCls} aria-label="Exam">
          {exams.map((x) => <option key={x._id} value={x._id}>{x.title}</option>)}
        </select>
        {exam && <span className="text-xs text-[var(--text-secondary)]">Semesters {exam.semesters.join(", ")} · {exam.status === "published" ? "published to students" : exam.status === "seated" ? "not published yet" : "no plan yet"}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <button id="seating-generate" onClick={generate} disabled={!!busy} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {busy === "gen" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} {exam?.status === "draft" ? "Make seating plan" : "Make again"}
          </button>
          {exam && exam.status !== "draft" && (
            <>
              <button onClick={() => act("re", () => api.post(`/mst-exam/exams/${examId}/recheck`, {}))} disabled={!!busy} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5" title="Attendance or fees changed? Check everyone again — seats follow.">
                {busy === "re" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check again
              </button>
              <button id="seating-publish" onClick={() => act("pub", () => api.post(`/mst-exam/exams/${examId}/publish`, { published: exam.status !== "published" }))} disabled={!!busy} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
                {exam.status === "published" ? <EyeOff size={13} /> : <Eye size={13} />} {exam.status === "published" ? "Hide from students" : "Publish to students"}
              </button>
              <button onClick={() => file(`/mst-exam/exams/${examId}/export/seating`, "Seating.xlsx")} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><Download size={13} /> Excel</button>
            </>
          )}
        </div>
      </div>

      {!data ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Students" value={stats.total} icon={Users} tone="text-[var(--primary)] bg-[var(--primary)]/10" />
            <Stat label="Allowed" value={stats.allowed} icon={CheckCircle2} tone="text-emerald-600 bg-emerald-500/10" />
            <Stat label="Seated" value={stats.seated} icon={Armchair} tone="text-sky-600 bg-sky-500/10" />
            <Stat label="Reserved (not allowed)" value={stats.reserved} icon={ShieldAlert} tone="text-amber-600 bg-amber-500/10" />
            <Stat label="No seat" value={stats.none} icon={ShieldAlert} tone="text-red-600 bg-red-500/10" />
          </div>
          {stats.none > 0 && exam.status !== "draft" && <p className="text-xs font-semibold text-red-600">{stats.none} student(s) have no seat — make more rooms active, then “Make again”.</p>}

          <div className="flex flex-wrap items-center gap-2">
            {[["rooms", "Rooms", LayoutGrid], ["students", "Students", List]].map(([k, l, Icon]) => (
              <button key={k} onClick={() => setView(k)} className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 ${view === k ? "bg-[var(--primary)] text-white" : "border border-[var(--border-light)]"}`}><Icon size={13} /> {l}</button>
            ))}
            {view === "rooms" && <span className="text-xs text-[var(--text-secondary)]">{selected ? <><b>{selected.enrollmentNumber}</b> selected — click a seat to move there (or swap). Click it again to cancel.</> : "Click a student, then a seat, to move or swap. Green = seated, amber = reserved (not allowed yet)."}</span>}
          </div>

          {view === "rooms" ? (
            data.rooms.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">Make the seating plan to see the rooms.</div> : (
              <div className="grid xl:grid-cols-2 gap-4">
                {data.rooms.map((room) => (
                  <RoomGrid key={room._id} selected={selected} onSeat={onSeat}
                    room={{
                      ...room,
                      actions: [
                        <button key="c" onClick={() => file(`/mst-exam/exams/${examId}/rooms/${room._id}/chart.pdf`, "chart.pdf")} title="Door chart (PDF)" aria-label={`Seating chart for ${room.name}`} className="btn-outline-premium text-[11px] px-2.5 py-1.5 flex items-center gap-1"><FileText size={12} /> Chart</button>,
                        <select key="a" defaultValue="x" aria-label={`Attendance sheet for ${room.name}`} onChange={(e) => { if (e.target.value !== "x") file(`/mst-exam/exams/${examId}/rooms/${room._id}/attendance.pdf`, "attendance.pdf", e.target.value ? { session: e.target.value } : {}); e.target.value = "x"; }}
                          className="text-[11px] border border-[var(--border-light)] rounded-xl px-2 py-1.5 bg-[var(--bg-card)]">
                          <option value="x" disabled hidden>Attendance sheet…</option>
                          <option value="">All sittings</option>
                          {exam.sessions.map((s) => <option key={s.key} value={s.key}>{dateText(s.date)} {s.startTime}</option>)}
                        </select>,
                      ],
                    }} />
                ))}
              </div>
            )
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[var(--border-light)]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search seating" className={`${inputCls} w-full pl-8`} />
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls} aria-label="Filter">
                  <option value="">All</option><option value="allowed">Allowed</option><option value="not">Not allowed</option><option value="noseat">No seat</option><option value="override">Decided by coordinator</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead><tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                    <th className="px-4 py-3">Student</th><th className="px-4 py-3">Sem</th><th className="px-4 py-3 text-right">Att.</th><th className="px-4 py-3 text-right">Fees</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Seat</th><th className="px-4 py-3 text-right">Decide</th>
                  </tr></thead>
                  <tbody>
                    {entries.map((e) => {
                      const decided = e.override?.allowed !== null && e.override?.allowed !== undefined;
                      return (
                        <tr key={e._id} className="border-b border-[var(--border-light)] last:border-0">
                          <td className="px-4 py-2.5"><div className="font-bold text-[var(--text-primary)]">{e.name}</div><div className="text-[11px] font-mono text-[var(--text-secondary)]">{e.enrollmentNumber}</div></td>
                          <td className="px-4 py-2.5 text-xs">{e.semester}{e.section ? ` · ${e.section}` : ""}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{e.attendance}%</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{e.duesFees > 0 ? rupees(e.duesFees) : "—"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${e.allowed ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>{e.allowed ? "Allowed" : "Not allowed"}</span>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{decided ? <>&ldquo;{e.override.reason}&rdquo; — {e.override.byName}{e.override.at ? `, ${new Date(e.override.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}</> : e.reasons.join(" · ")}</div>
                          </td>
                          <td className="px-4 py-2.5 text-xs">{e.seatStatus === "none" ? <span className="text-red-600 font-semibold">No seat</span> : <>{e.room} · {e.seatLabel}{e.seatStatus === "reserved" ? <span className="text-amber-600"> (reserved)</span> : ""}</>}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-1.5">
                              {!e.allowed && <button onClick={() => decide(e, true)} disabled={!!busy} aria-label={`Allow ${e.name}`} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center gap-1"><ShieldCheck size={12} /> Allow</button>}
                              {e.allowed && <button onClick={() => decide(e, false)} disabled={!!busy} aria-label={`Stop ${e.name}`} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 flex items-center gap-1"><ShieldAlert size={12} /> Stop</button>}
                              {decided && <button onClick={() => decide(e, null)} disabled={!!busy} title="Let the rules decide again" aria-label={`Clear decision for ${e.name}`} className="p-1.5 rounded-lg border border-[var(--border-light)]"><Undo2 size={12} /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {deciding && (
        <DecisionModal student={deciding.e} allowed={deciding.allowed} onClose={() => setDeciding(null)}
          onSubmit={(comment) => decide(deciding.e, deciding.allowed, comment)} />
      )}
    </div>
  );
}
