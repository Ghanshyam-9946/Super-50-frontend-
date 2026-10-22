import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import api from "../services/api";

// The monthly Top 10 badges a student has earned on the leaderboard, shown
// on their profile. Rank 1 is gold, 2–3 silver, 4–10 purple.
//
// `studentId` shows another student's badges (staff looking at a profile);
// without it, the logged-in student's own.

const STYLE = (rank) => {
  if (rank === 1) {
    return { icon: Trophy, chip: "from-amber-300 via-yellow-400 to-amber-500 text-amber-950 shadow-amber-500/30", ring: "ring-amber-300/60" };
  }
  if (rank <= 3) {
    return { icon: Medal, chip: "from-slate-200 via-slate-300 to-slate-400 text-slate-800 shadow-slate-400/30", ring: "ring-slate-300/60" };
  }
  return { icon: Award, chip: "from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-violet-500/30", ring: "ring-violet-300/50" };
};

export function TopTenBadge({ award, size = "md" }) {
  const { icon: Icon, chip, ring } = STYLE(award.rank);
  const small = size === "sm";
  return (
    <span
      title={`Top 10 — ${award.monthLabel} · Rank #${award.rank}${award.score != null ? ` · Score ${award.score}` : ""}`}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-br ${chip} shadow-md ring-2 ${ring} ${small ? "pl-1 pr-2.5 py-0.5" : "pl-1.5 pr-3 py-1"}`}
    >
      <span className={`flex items-center justify-center rounded-full bg-white/30 ${small ? "w-5 h-5" : "w-7 h-7"}`}>
        <Icon size={small ? 11 : 15} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-black ${small ? "text-[10px]" : "text-xs"}`}>#{award.rank} · Top 10</span>
        <span className={`font-bold opacity-80 ${small ? "text-[9px]" : "text-[10px]"} mt-0.5`}>{award.monthLabel}</span>
      </span>
    </span>
  );
}

export default function TopTenBadges({ studentId, title = "Top 10 Badges", size = "md", className = "" }) {
  const [awards, setAwards] = useState([]);

  useEffect(() => {
    let alive = true;
    api.get(studentId ? `/leaderboard-awards/student/${studentId}` : "/leaderboard-awards/mine")
      .then(({ data }) => { if (alive) setAwards(data.data || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [studentId]);

  if (awards.length === 0) return null;

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
          <Trophy size={12} className="text-amber-500" /> {title}
          <span className="text-amber-600">× {awards.length}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {awards.map((a) => <TopTenBadge key={a._id} award={a} size={size} />)}
      </div>
    </div>
  );
}
