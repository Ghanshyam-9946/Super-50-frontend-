import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ClipboardList, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { STATUS_STYLE } from "./appraisalHelpers";

const MODES = {
  my: {
    url: "/appraisal/mine", title: "My Appraisal", icon: ClipboardList,
    hint: "Appraisal forms released to you. Fill them in, then submit — they go to your HOD (or to the Principal for an HOD's own form).",
    empty: "No appraisal form has been released to you.",
  },
  review: {
    url: "/appraisal/review", title: "Appraisal Review (HOD)", icon: ClipboardCheck,
    hint: "Your department's faculty appraisals. Mark Section B and C, then send them to the Principal.",
    empty: "Nothing to review yet — forms appear here once faculty submit them.",
  },
  principal: {
    url: "/appraisal/principal", title: "Appraisal — Principal", icon: ClipboardCheck,
    hint: "Appraisals reviewed by the HODs, and HODs' own appraisals. Add your marks and final comment to complete them.",
    empty: "Nothing waiting for you yet.",
  },
};

export default function AppraisalListPage({ mode = "my" }) {
  const m = MODES[mode];
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    setList(null);
    api.get(m.url)
      .then(({ data }) => setList(data.data))
      .catch((err) => { toast.error(err.response?.data?.message || "Could not load"); setList([]); });
  }, [m.url]);

  const openStatus = { my: ["faculty"], review: ["hod"], principal: ["principal"] }[mode];
  const shown = (list || []).filter((a) => filter === "all" || openStatus.includes(a.status));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20"><m.icon size={26} /></div>
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">{m.title}</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">{m.hint}</p>
        </div>
      </header>

      <div className="flex gap-2">
        {[["open", "Waiting for me"], ["all", "All"]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`text-xs font-bold px-3 py-2 rounded-xl ${filter === k ? "bg-[var(--primary)] text-white" : "glass-card text-[var(--text-primary)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {!list ? (
        <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : shown.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">{filter === "open" && list.length ? "Nothing waiting for you — see All." : m.empty}</div>
      ) : (
        <div className="space-y-2.5">
          {shown.map((a) => (
            <Link key={a._id} to={`/appraisal/form/${a._id}`} className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 hover:border-[var(--primary)]/50 border border-transparent transition-colors">
              <div className="flex-1 min-w-[220px]">
                <div className="font-bold text-sm text-[var(--text-primary)]">
                  {mode === "my" ? a.cycle?.title : a.appraisee?.name}
                  {mode !== "my" && <span className="font-medium text-[var(--text-secondary)]"> · {a.appraisee?.department || "—"}{a.formFor === "hod" ? " · HOD" : ""}</span>}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{mode === "my" ? a.cycle?.period : `${a.cycle?.title} · ${a.cycle?.period}`}</div>
              </div>
              {a.total !== undefined && a.total !== null && <span className="text-xs font-bold text-[var(--text-primary)]">{a.total} / {a.totalMax}</span>}
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${STATUS_STYLE[a.status]}`}>{a.statusLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
