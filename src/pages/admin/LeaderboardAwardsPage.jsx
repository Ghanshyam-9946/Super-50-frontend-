import { useEffect, useState } from "react";
import { Trophy, Loader2, Rocket, Undo2, Download, AlertTriangle, Palette } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Every month the leaderboard's top ten get a certificate.
//
// Releasing a month takes a snapshot: rank and score are written down as
// they stand that day, because the leaderboard keeps moving and a
// certificate has to go on saying what it said when it was issued.

const monthInput = (value) => value || "";

export default function LeaderboardAwardsPage() {
  const [month, setMonth] = useState("");
  const [preview, setPreview] = useState(null);
  const [releases, setReleases] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
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
      const [, rel, tpl] = await Promise.all([
        loadPreview(month),
        api.get("/leaderboard-awards"),
        api.get("/trainings/templates").catch(() => ({ data: { data: [] } })),
      ]);
      setReleases(rel.data.data || []);
      const list = tpl.data.data || [];
      setTemplates(list);
      setTemplateId((prev) => prev || list[0]?._id || "");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the awards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const release = async () => {
    if (!templateId) return toast.error("Pick a certificate design first");
    if (!window.confirm(`Release certificates to the top ${preview?.data?.length || 10} for ${preview?.monthLabel}?`)) return;
    setBusy("release");
    try {
      const { data } = await api.post("/leaderboard-awards/release", { month, templateId });
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not release them");
    } finally {
      setBusy("");
    }
  };

  const withdraw = async (m, label) => {
    if (!window.confirm(`Withdraw every certificate for ${label}? Students will stop seeing them.`)) return;
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
            Monthly Top 10 Certificates
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Release a month and its top ten get a certificate they can download from their leaderboard.
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
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex-1 min-w-[220px]">
            Certificate design
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1.5 block w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              {templates.length === 0 && <option value="">No designs yet</option>}
              {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </label>
          <button
            onClick={release}
            disabled={busy === "release" || preview?.released || !templateId}
            className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40"
          >
            {busy === "release" ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            {preview?.released ? "Already released" : "Release certificates"}
          </button>
        </div>

        {templates.length === 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <Palette size={13} /> Design a certificate under Trainings first — the same designs are used here.
          </p>
        )}

        <div>
          <h2 className="font-display font-black text-base text-[var(--text-primary)]">
            {preview?.monthLabel} — who would get one
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
                    {r.winners.length} certificate(s) · design: {r.template?.name || "none attached"}
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
              {!r.template && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-1.5">
                  <AlertTriangle size={11} /> No design attached — students cannot download these. Withdraw and release again with a design.
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.winners.map((w) => (
                  <span key={w._id} className="text-[11px] px-2 py-1 rounded-lg bg-[var(--bg-input)] text-[var(--text-secondary)]">
                    #{w.rank} {w.student?.name}
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

// Shown to a student on their leaderboard: the months they finished in the
// top ten, each with its certificate.
export function MyLeaderboardCertificates() {
  const [awards, setAwards] = useState([]);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api.get("/leaderboard-awards/mine")
      .then(({ data }) => setAwards(data.data || []))
      .catch(() => {});
  }, []);

  const download = async (award) => {
    setBusy(award._id);
    try {
      const res = await api.get(`/leaderboard-awards/${award._id}/certificate`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Leaderboard-${award.month}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open the certificate");
    } finally {
      setBusy("");
    }
  };

  if (awards.length === 0) return null;

  return (
    <div className="glass-card p-5 rounded-3xl space-y-3">
      <h2 className="font-display font-black text-base text-[var(--text-primary)] flex items-center gap-2">
        <Trophy size={17} className="text-amber-500" /> Your top-10 certificates
      </h2>
      <div className="flex flex-wrap gap-2">
        {awards.map((a) => (
          <button
            key={a._id}
            onClick={() => download(a)}
            disabled={busy === a._id}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-light)] hover:border-[var(--primary)] text-sm disabled:opacity-50"
          >
            {busy === a._id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} className="text-[var(--primary)]" />}
            <span className="font-bold text-[var(--text-primary)]">#{a.rank}</span>
            <span className="text-[var(--text-secondary)]">{a.monthLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
