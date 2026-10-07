import { useEffect, useState } from "react";
import { ListChecks, Loader2, Check, Star, MessageSquare, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Two things a student does around a training: say which one they want to
// do, and afterwards say what they thought of whoever taught it.

/* ------------------------- choosing a training ------------------------- */

export const TrainingChoice = () => {
  const [rounds, setRounds] = useState([]);
  const [picks, setPicks] = useState({});
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/trainings/choice-rounds/mine");
      setRounds(data.data || []);
      const seed = {};
      (data.data || []).forEach((r) => {
        seed[r._id] = (r.myChoice?.preferences || []).map(String);
      });
      setPicks(seed);
    } catch {
      /* a student with no rounds simply sees nothing */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Clicking a training adds it to the end of your order, or takes it out.
  const toggle = (roundId, trainingId, maxChoices) => {
    setPicks((prev) => {
      const current = prev[roundId] || [];
      if (current.includes(trainingId)) {
        return { ...prev, [roundId]: current.filter((t) => t !== trainingId) };
      }
      if (current.length >= maxChoices) {
        toast.error(`You may pick at most ${maxChoices}`);
        return prev;
      }
      return { ...prev, [roundId]: [...current, trainingId] };
    });
  };

  const submit = async (round) => {
    const prefs = picks[round._id] || [];
    if (prefs.length === 0) return toast.error("Pick at least one");
    setBusy(round._id);
    try {
      const { data } = await api.post(`/trainings/choice-rounds/${round._id}/choose`, { preferences: prefs });
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your choice");
    } finally {
      setBusy("");
    }
  };

  if (loading || rounds.length === 0) return null;

  return (
    <div className="space-y-4">
      {rounds.map((round) => {
        const chosen = picks[round._id] || [];
        const allotted = round.myChoice?.allotted;
        return (
          <div key={round._id} className="glass-card p-5 rounded-3xl space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                  <ListChecks size={17} className="text-[var(--primary)]" /> {round.title}
                </h2>
                {round.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{round.description}</p>}
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                  <Clock size={11} />
                  {round.deadline
                    ? `Closes ${new Date(round.deadline).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
                    : "No deadline"}
                  {" · "}pick up to {round.maxChoices}, in order of preference
                </p>
              </div>
              {allotted && (
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600">
                  Allotted: {allotted.name || "—"}
                </span>
              )}
            </div>

            {!round.live && !allotted && (
              <p className="text-xs text-amber-600">This round is closed.</p>
            )}

            <div className="space-y-1.5">
              {round.trainings.map((t) => {
                const rank = chosen.indexOf(String(t._id));
                const disabled = !round.live || !!allotted;
                return (
                  <button
                    key={t._id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(round._id, String(t._id), round.maxChoices)}
                    className={`w-full text-left flex items-center gap-3 border rounded-2xl p-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      rank > -1 ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border-light)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      rank > -1 ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-input)] text-[var(--text-secondary)]"
                    }`}>
                      {rank > -1 ? rank + 1 : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-sm text-[var(--text-primary)]">{t.name}</span>
                      <span className="block text-[11px] text-[var(--text-secondary)]">
                        {new Date(t.fromDate).toLocaleDateString()} – {new Date(t.toDate).toLocaleDateString()}
                        {t.location ? ` · ${t.location}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {round.live && !allotted && (
              <button onClick={() => submit(round)} disabled={busy === round._id}
                className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40">
                {busy === round._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {round.myChoice ? "Update my choice" : "Submit my choice"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------- rating the trainer ------------------------- */

export const TrainingFeedbackForm = ({ trainingId }) => {
  const [form, setForm] = useState(null);
  const [active, setActive] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/trainings/${trainingId}/feedback/form`);
      setForm(data);
    } catch {
      setForm(null); // feedback is simply not open
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [trainingId]);

  const start = (trainer) => {
    setActive(trainer);
    setRatings(form.questions.map(() => 0));
    setComment("");
  };

  const submit = async () => {
    if (ratings.some((r) => !r)) return toast.error("Please answer every question");
    setBusy(true);
    try {
      const { data } = await api.post(`/trainings/${trainingId}/feedback`, {
        faculty: active._id,
        ratings: ratings.map((rating) => ({ rating })),
        comment,
      });
      toast.success(data.message);
      setActive(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send your feedback");
    } finally {
      setBusy(false);
    }
  };

  if (!form?.trainers?.length) return null;

  return (
    <div className="border-t border-[var(--border-light)] pt-3 mt-3 space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
        <MessageSquare size={12} /> Rate the trainer
      </p>

      {!active ? (
        <div className="flex flex-wrap gap-2">
          {form.trainers.map((t) => (
            <button key={t._id} onClick={() => start(t)} disabled={t.done}
              className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 ${
                t.done
                  ? "border-emerald-500/40 text-emerald-600 cursor-default"
                  : "border-[var(--border-light)] text-[var(--text-primary)] hover:border-[var(--primary)]"
              }`}>
              {t.done ? <Check size={12} /> : <Star size={12} />} {t.name}{t.done ? " · done" : ""}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-3">
          <p className="text-sm font-bold text-[var(--text-primary)]">{active.name}</p>
          {form.questions.map((q, i) => (
            <div key={q} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-secondary)] flex-1 min-w-[180px]">{q}</span>
              <span className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button"
                    onClick={() => setRatings(ratings.map((r, j) => (j === i ? n : r)))}
                    className="p-0.5"
                    title={`${n} out of 5`}>
                    <Star size={16} className={n <= ratings[i] ? "text-amber-500 fill-amber-500" : "text-[var(--text-secondary)] opacity-40"} />
                  </button>
                ))}
              </span>
            </div>
          ))}
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
            placeholder="Anything you want to add (optional)"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
          <p className="text-[10px] text-[var(--text-secondary)]">
            Your name is never shown with your answers — the trainer only sees the averages.
          </p>
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Send
            </button>
            <button onClick={() => setActive(null)} className="text-xs font-bold text-[var(--text-secondary)] px-3">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
