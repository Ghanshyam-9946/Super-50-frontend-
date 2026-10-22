import { useEffect, useState } from "react";
import { Trophy, Loader2, Rocket, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { TopTenBadge } from "../../components/TopTenBadges";

// Every month the leaderboard's top ten get a badge on their profile.
//
// Releasing a month takes a snapshot: rank and score are written down as
// they stand that day, because the leaderboard keeps moving and a badge has
// to go on saying what it said when it was given.

const monthInput = (value) => value || "";

export default function LeaderboardAwardsPage() {
  const [month, setMonth] = useState("");
  const [preview, setPreview] = useState(null);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const loadPreview = async (m) => {
    const { data } = await api.get("/leaderboard-awards/preview", { params: m ? { month: m } : {} });
    setPreview(data);
    if (!m) setMonth(data.month);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [, rel] = await Promise.all([
        loadPreview(month),
        api.get("/leaderboard-awards"),
      ]);
      setReleases(rel.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the awards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const release = async () => {
    if (!window.confirm(`Give the Top 10 badge to the top ${preview?.data?.length || 10} for ${preview?.monthLabel}?`)) return;
    setBusy("release");
    try {
      const { data } = await api.post("/leaderboard-awards/release", { month });
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not release them");
    } finally {
      setBusy("");
    }
  };

  const withdraw = async (m, label) => {
    if (!window.confirm(`Withdraw every badge for ${label}? They will disappear from the students' profiles.`)) return;
    setBusy(m);
    try {
      const { data } = await api.delete(`/leaderboard-awards/${m}`);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not withdraw them");
    } finally {
      setBusy("");
    }
  };

  const changeMonth = async (value) => {
    setMonth(value);
    try {
      await loadPreview(value);
    } catch {
      /* an invalid month just leaves the previous preview up */
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      <header className="glass-card flex flex-wrap items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Trophy className="text-amber-500" size={26} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Monthly Top 10 Badges
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Release a month and its top ten get a Top 10 badge on their profile — gold for #1, silver for #2–3.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            Month
            <input
              type="month"
              value={monthInput(month)}
              onChange={(e) => changeMonth(e.target.value)}
              className="mt-1.5 block bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <button
            onClick={release}
            disabled={busy === "release" || preview?.released}
            className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40"
          >
            {busy === "release" ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            {preview?.released ? "Already released" : "Release badges"}
          </button>
        </div>

        <div>
          <h2 className="font-display font-black text-base text-[var(--text-primary)]">
            {preview?.monthLabel} — who would get the badge
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] mb-2">
            Taken from the leaderboard as it stands right now. Releasing freezes these ranks and scores.
          </p>
          {preview?.data?.length ? (
            <div className="space-y-1.5">
              {preview.data.map((row) => (
                <div key={row.student._id} className="flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    row.rank === 1 ? "bg-amber-400/25 text-amber-600"
                      : row.rank <= 3 ? "bg-slate-400/25 text-slate-500"
                      : "bg-[var(--primary)]/10 text-[var(--primary)]"
                  }`}>{row.rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--text-primary)] truncate">{row.student.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {row.student.enrollmentNumber || row.student.enrollmentNo || row.student.email}
                      {row.student.semester ? ` · Sem ${row.student.semester}` : ""}
                    </div>
                  </div>
                  <span className="text-sm font-black text-[var(--text-primary)]">{row.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Nobody is on the leaderboard yet.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-5 rounded-3xl space-y-3">
        <h2 className="font-display font-black text-base text-[var(--text-primary)]">Released months</h2>
        {releases.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Nothing has been released yet.</p>
        ) : (
          releases.map((r) => (
            <div key={r.month} className="border border-[var(--border-light)] rounded-2xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">{r.monthLabel}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {r.winners.length} badge(s)
                  </div>
                </div>
                <button
                  onClick={() => withdraw(r.month, r.monthLabel)}
                  disabled={busy === r.month}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {busy === r.month ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />} Withdraw
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.winners.map((w) => (
                  <span key={w._id} className="flex items-center gap-1.5 text-[11px] pr-2 rounded-full bg-[var(--bg-input)] text-[var(--text-primary)]">
                    <TopTenBadge award={{ ...w, monthLabel: r.monthLabel }} size="sm" /> {w.student?.name}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

