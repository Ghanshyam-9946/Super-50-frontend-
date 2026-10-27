import { useCallback, useEffect, useState } from "react";
import { Armchair, CalendarDays, CheckCircle2, Circle, ClipboardCheck, DoorOpen, GraduationCap, LayoutDashboard, UserCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import MSTEligibilityTab from "./MSTEligibilityTab";
import MSTRoomsTab from "./MSTRoomsTab";
import MSTExamsTab from "./MSTExamsTab";
import MSTSeatingTab from "./MSTSeatingTab";
import MSTDutyTab from "./MSTDutyTab";
import { dateText, errText } from "./mstUtils";

// MST Exam — the admin, the Academic Coordinator and the Exam Coordinator.
const TABS = [
  ["overview", "Overview", LayoutDashboard],
  ["allowed", "Allowed Students", Users],
  ["rooms", "Rooms", DoorOpen],
  ["exams", "Exams & Dates", CalendarDays],
  ["seating", "Seating Plan", Armchair],
  ["duty", "Invigilation Duty", UserCheck],
];

function Overview({ exams, rooms, open }) {
  const active = rooms.filter((r) => r.isActive);
  if (!exams.length) {
    return (
      <div className="glass-card rounded-3xl p-8 space-y-3">
        <h2 className="font-display font-black text-xl text-[var(--text-primary)]">Getting started</h2>
        <ol className="text-sm text-[var(--text-secondary)] list-decimal pl-5 space-y-1">
          <li><b>Rooms</b> — add the exam rooms: rows, columns, single and double benches.</li>
          <li><b>Exams &amp; Dates</b> — create MST-1 with its semesters, the allow rule and the date sheet.</li>
          <li><b>Seating Plan</b> — make it, check it, publish it to the students.</li>
          <li><b>Invigilation Duty</b> — auto-assign the faculty, adjust, publish to them.</li>
        </ol>
        <button onClick={() => open(null, "rooms")} className="btn-premium text-sm px-4 py-2">Add the rooms</button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">{active.length} active room(s) · {active.reduce((n, r) => n + r.capacity, 0)} seats</p>
      <div className="grid lg:grid-cols-2 gap-4">
        {exams.map((e) => {
          const steps = [
            ["Date sheet", e.sessions.length > 0, "exams"],
            ["Seating plan made", e.status !== "draft", "seating"],
            ["Published to students", e.status === "published", "seating"],
            ["Invigilators assigned", (e.dutyCount || 0) > 0 || e.dutiesPublished, "duty"],
            ["Duties published to faculty", e.dutiesPublished, "duty"],
          ];
          const next = e.sessions.filter((s) => s.date >= new Date().toISOString().slice(0, 10))[0];
          return (
            <div key={e._id} className="glass-card rounded-3xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display font-black text-xl text-[var(--text-primary)]">{e.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Semesters {e.semesters.join(", ")}{e.dates.length ? ` · ${dateText(e.dates[0])} → ${dateText(e.dates[e.dates.length - 1])}` : ""}</div>
                </div>
                {e.counts && <div className="text-right"><div className="text-2xl font-black text-emerald-600">{e.counts.allowed}</div><div className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">of {e.counts.total} allowed</div></div>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {steps.map(([label, done, tab]) => (
                  <button key={label} onClick={() => open(e._id, tab)} className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl text-left ${done ? "bg-emerald-500/10 text-emerald-700" : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--primary)]"}`}>
                    {done ? <CheckCircle2 size={14} /> : <Circle size={14} />} {label}
                  </button>
                ))}
              </div>
              {next && <div className="text-xs text-[var(--text-secondary)]">Next sitting: <b className="text-[var(--text-primary)]">{dateText(next.date)} {next.startTime}</b> — {next.papers.map((p) => `Sem ${p.semester}`).join(", ")}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MSTExamPage() {
  const [tab, setTab] = useState("overview");
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [examId, setExamId] = useState("");

  const reload = useCallback(() => Promise.all([api.get("/mst-exam/exams"), api.get("/mst-exam/rooms")])
    .then(([e, r]) => {
      setExams(e.data.data);
      setRooms(r.data.data);
      setExamId((id) => (id && e.data.data.some((x) => x._id === id) ? id : e.data.data[0]?._id || ""));
    })
    .catch((err) => toast.error(errText(err, "Could not load"))), []);
  useEffect(() => { reload(); }, [reload, tab]);

  const open = (id, t) => { if (id) setExamId(id); setTab(t); };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><GraduationCap className="text-[var(--primary)]" size={26} /></div>
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">MST Exam</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">Who may sit, the rooms, the date sheet, the seating plan and the invigilation duty — in one place.</p>
        </div>
        <ClipboardCheck className="text-[var(--text-secondary)] opacity-30 hidden md:block" size={44} />
      </header>

      <div className="flex flex-wrap gap-1.5" role="tablist">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`text-sm font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-colors ${tab === k ? "bg-[var(--primary)] text-white shadow-sm" : "bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview exams={exams} rooms={rooms} open={open} />}
      {tab === "allowed" && <MSTEligibilityTab exams={exams} />}
      {tab === "rooms" && <MSTRoomsTab />}
      {tab === "exams" && <MSTExamsTab exams={exams} reload={reload} onOpen={open} />}
      {tab === "seating" && <MSTSeatingTab exams={exams} examId={examId} setExamId={setExamId} reload={reload} />}
      {tab === "duty" && <MSTDutyTab exams={exams} examId={examId} setExamId={setExamId} reload={reload} />}
    </div>
  );
}
