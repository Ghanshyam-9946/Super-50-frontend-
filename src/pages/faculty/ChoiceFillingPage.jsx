import { useState, useEffect } from "react";
import { ListChecks, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const PRIORITIES = [1, 2, 3, 4, 5];

// A round's picks are valid once at least 2 priorities are filled, in order
// from Priority 1 with no gap in between (Priority 2 filled but Priority 1
// empty isn't a valid ranking) — mirrors the backend's own check.
const trimPicks = (slots) => {
  const trimmed = [...slots];
  while (trimmed.length && !trimmed[trimmed.length - 1]) trimmed.pop();
  return trimmed;
};
const isRoundValid = (slots) => {
  const trimmed = trimPicks(slots);
  return trimmed.length >= 2 && !trimmed.some((s) => !s);
};

export default function ChoiceFillingPage() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState({}); // roundId -> [priority1SubjectId, priority2SubjectId, ...]
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/choice-filling/my-round");
      if (data.success) {
        setRounds(data.data);
        const initial = {};
        data.data.forEach((r) => {
          const bySlot = PRIORITIES.map(() => "");
          (r.myPicks || []).forEach((p) => {
            bySlot[p.priority - 1] = p.subject;
          });
          initial[r.round._id] = bySlot;
        });
        setPicks(initial);
      }
    } catch {
      toast.error("Failed to load choice filling rounds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setPick = (roundId, priorityIdx, subjectId) => {
    setPicks((prev) => {
      const slots = [...(prev[roundId] || PRIORITIES.map(() => ""))];
      slots[priorityIdx] = subjectId;
      return { ...prev, [roundId]: slots };
    });
  };

  // One button submits every open round at once — each round still needs
  // at least 2 valid, gap-free priority picks before this will proceed.
  const submitAll = async () => {
    const invalidRound = rounds.find(({ round }) => !isRoundValid(picks[round._id] || []));
    if (invalidRound) {
      return toast.error(
        `${invalidRound.round.batch} — Semester ${invalidRound.round.semester}: pick at least 2 subjects, in order from Priority 1`
      );
    }

    setSubmitting(true);
    try {
      await Promise.all(
        rounds.map(({ round }) =>
          api.post("/master-data/choice-filling/submit", {
            roundId: round._id,
            picks: trimPicks(picks[round._id] || []),
          })
        )
      );
      toast.success("Choices submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit choices");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[var(--primary)]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ListChecks size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Subject Choice Filling</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Rank at least 2 subjects you'd like to teach — Priority 1 is your top pick. The coordinator finalizes the actual allocation.
          </p>
        </div>
      </header>

      {rounds.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No choice filling rounds are open right now.
        </div>
      ) : (
        <>
          {rounds.map(({ round, subjects }) => {
            const slots = picks[round._id] || PRIORITIES.map(() => "");
            return (
              <div key={round._id} className="glass-card p-5 rounded-2xl space-y-3">
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                  {round.batch} — Semester {round.semester}
                </h3>
                {subjects.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">No subjects defined for this semester yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {PRIORITIES.map((p) => {
                      const idx = p - 1;
                      const takenElsewhere = slots.filter((_, i) => i !== idx);
                      return (
                        <label key={p} className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                          Priority {p}
                          <select
                            value={slots[idx]}
                            onChange={(e) => setPick(round._id, idx, e.target.value)}
                            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                          >
                            <option value="">Select subject</option>
                            {subjects
                              .filter((s) => !takenElsewhere.includes(s._id))
                              .map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.subjectName} {s.subjectCode && `(${s.subjectCode})`}
                                </option>
                              ))}
                          </select>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={submitAll}
            disabled={submitting}
            className="btn-premium text-sm px-5 py-3 flex items-center gap-1.5 disabled:opacity-40"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Submit Choices
          </button>
        </>
      )}
    </div>
  );
}
