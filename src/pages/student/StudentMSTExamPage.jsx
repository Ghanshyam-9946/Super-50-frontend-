import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Armchair, CalendarDays, CheckCircle2, Download, GraduationCap, Hourglass, Loader2, Wallet, CalendarX } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { dateText, download, errText, rupees } from "../exam/mstUtils";

// The student's MST: allowed or not (and why), their seat, the date sheet
// and the admit card. Before the seating is published it shows where they
// stand by the rules so far.
export default function StudentMSTExamPage() {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    api.get("/mst-exam/my").then(({ data }) => setList(data.data)).catch((err) => { toast.error(errText(err, "Could not load")); setList([]); });
  }, []);
  const admit = async (e) => {
    setBusy(e._id);
    try { await download(`/mst-exam/my/${e._id}/admit-card.pdf`, "Admit_Card.pdf"); } catch (err) {
      let msg = "Could not download";
      try { msg = JSON.parse(await err.response.data.text()).message || msg; } catch { /* keep */ }
      toast.error(msg);
    } finally { setBusy(""); }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><GraduationCap className="text-[var(--primary)]" size={26} /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">MST Exam</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">Whether you may sit MST-1 / MST-2, your seat, the date sheet and your admit card.</p>
        </div>
      </header>

      {!list ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        : list.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">No MST exam for your semester yet.</div> : list.map((e, i) => (
          <motion.div key={e._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-3xl overflow-hidden border-t-4 ${e.allowed ? "!border-t-emerald-500" : "!border-t-red-500"}`}>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display font-black text-2xl text-[var(--text-primary)]">{e.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{e.session}{e.provisional ? " · seating not out yet" : ""}</div>
                </div>
                {e.allowed ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-black px-4 py-2 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"><CheckCircle2 size={16} /> {e.provisional ? "Eligible so far" : "Allowed"}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-black px-4 py-2 rounded-full bg-red-600 text-white shadow-sm shadow-red-600/30"><AlertTriangle size={16} /> Not allowed{e.provisional ? " yet" : ""}</span>
                )}
              </div>

              {!e.allowed && (
                <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-4 space-y-1.5">
                  <div className="text-xs font-black uppercase tracking-widest text-red-600">Why</div>
                  {e.reasons.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      {r.startsWith("Fees") ? <Wallet size={15} className="text-red-600" /> : <CalendarX size={15} className="text-red-600" />} {r}
                    </div>
                  ))}
                  <div className="text-xs text-[var(--text-secondary)]">Contact your TG. Once it is cleared you are allowed and get your seat.</div>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[var(--bg-input)]/60 p-3"><div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Your attendance</div><div className={`text-xl font-black ${e.attendance >= e.rules.minAttendance ? "text-emerald-600" : "text-red-600"}`}>{e.attendance}%</div><div className="text-[11px] text-[var(--text-secondary)]">needs {e.rules.minAttendance}%</div></div>
                <div className="rounded-2xl bg-[var(--bg-input)]/60 p-3"><div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Fees due</div><div className={`text-xl font-black ${e.duesFees > 0 ? "text-red-600" : "text-emerald-600"}`}>{e.duesFees > 0 ? rupees(e.duesFees) : "Clear"}</div></div>
                <div className="rounded-2xl bg-[var(--bg-input)]/60 p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1"><Armchair size={11} /> Your seat</div>
                  {e.seat ? <><div className="text-xl font-black text-[var(--text-primary)]">Room {e.seat.room}</div><div className="text-[11px] text-[var(--text-secondary)]">{e.seat.label}</div></>
                    : <div className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-1 mt-1"><Hourglass size={13} /> {e.provisional ? "Not out yet" : "No seat"}</div>}
                </div>
              </div>

              {e.papers.length > 0 && (
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5 flex items-center gap-1"><CalendarDays size={12} /> Date sheet</div>
                  <div className="divide-y divide-[var(--border-light)] border border-[var(--border-light)] rounded-2xl overflow-hidden">
                    {e.papers.map((p) => (
                      <div key={`${p.date}${p.startTime}`} className="flex flex-wrap items-center gap-x-4 px-4 py-2.5 text-sm">
                        <b className="text-[var(--text-primary)] w-40">{dateText(p.date)}</b>
                        <span className="text-[var(--primary)] font-semibold w-28">{p.startTime}{p.endTime ? `–${p.endTime}` : ""}</span>
                        <span className="text-[var(--text-secondary)]">{[p.subjectCode, p.subjectName].filter(Boolean).join(" — ") || "Paper"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {e.admitCard && (
                <button onClick={() => admit(e)} disabled={busy === e._id} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                  {busy === e._id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download admit card
                </button>
              )}
            </div>
          </motion.div>
        ))}
    </div>
  );
}
