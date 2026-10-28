import { useEffect, useState } from "react";
import { CalendarClock, GraduationCap, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import MSTEligibilityTab from "./MSTEligibilityTab";
import { dateText, errText } from "./mstUtils";

// MST Exam for every faculty member: the allowed list of their own TG
// students, and their invigilation duties once they are published.
export default function FacultyMSTPage() {
  const [tab, setTab] = useState("duties");
  const [duties, setDuties] = useState(null);

  useEffect(() => {
    api.get("/mst-exam/my-duties").then(({ data }) => setDuties(data.data)).catch((err) => { toast.error(errText(err, "Could not load duties")); setDuties([]); });
  }, []);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (duties || []).filter((d) => d.date >= today);
  const past = (duties || []).filter((d) => d.date < today);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><GraduationCap className="text-[var(--primary)]" size={26} /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">MST Exam</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">Your invigilation duties, and which of your TG students may sit the MST.</p>
        </div>
      </header>
      <div className="flex gap-1.5" role="tablist">
        {[["duties", "My Duties", CalendarClock], ["tg", "My TG Students", Users]].map(([k, l, Icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`text-sm font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 ${tab === k ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-secondary)]"}`}>
            <Icon size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "tg" ? <MSTEligibilityTab tgView /> : !duties ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        : duties.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">No invigilation duty for you yet.</div> : (
          <div className="space-y-4">
            {[["Upcoming", upcoming], ["Done", past]].filter(([, l]) => l.length).map(([title, list]) => (
              <div key={title} className="space-y-2">
                <h2 className="font-display font-black text-[var(--text-primary)]">{title}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((d) => (
                    <div key={d._id} className={`glass-card rounded-2xl p-4 border-l-4 ${title === "Upcoming" ? "!border-l-[var(--primary)]" : "opacity-70"}`}>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{d.exam}</div>
                      <div className="font-display font-black text-lg text-[var(--text-primary)]">{dateText(d.date)}</div>
                      <div className="text-sm font-semibold text-[var(--primary)]">{d.startTime}{d.endTime ? ` – ${d.endTime}` : ""}</div>
                      <div className="text-sm mt-1">Room <b>{d.room}</b></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
