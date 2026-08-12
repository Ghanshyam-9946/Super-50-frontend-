import { useState, useEffect } from "react";
import { ListChecks, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const PRIORITIES = [1, 2, 3];

export default function ChoiceFillingPage() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState({}); // roundId -> [priority1SubjectId, priority2SubjectId, priority3SubjectId]
  const [submitting, setSubmitting] = useState(null); // roundId currently submitting

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/choice-filling/my-round");
      if (data.success) {
        setRounds(data.data);
        const initial = {};
        data.data.forEach((r) => {
          const bySlot = ["", "", ""];
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
      const slots = [...(prev[roundId] || ["", "", ""])];
      slots[priorityIdx] = subjectId;
      return { ...prev, [roundId]: slots };
    });
  };

  const submit = async (roundId) => {
    const slots = picks[roundId] || [];
    // Trim trailing empties, but a gap in the middle (e.g. Priority 1 empty,
    // Priority 2 filled) isn't a valid ranked submission.
    const trimmed = [...slots];
    while (trimmed.length && !trimmed[trimmed.length - 1]) trimmed.pop();
    if (trimmed.some((s) => !s)) {
      return toast.error("Fill priorities in order — Priority 1 first, then Priority 2, then Priority 3");
    }
    if (trimmed.length === 0) return toast.error("Pick at least a Priority 1 subject");

    setSubmitting(roundId);
    try {
      const { data } = await api.post("/master-data/choice-filling/submit", {
        roundId,
        picks: trimmed,
      });
      if (data.success) toast.success("Choices submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit choices");
    } finally {
      setSubmitting(null);
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
            Rank up to 3 subjects you'd like to teach — Priority 1 is your top pick. The coordinator finalizes the actual allocation.
          </p>
        </div>
      </header>

      {rounds.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No choice filling rounds are open right now.
        </div>
      ) : (
        rounds.map(({ round, subjects }) => {
          const slots = picks[round._id] || ["", "", ""];
          return (
            <div key={round._id} className="glass-card p-5 rounded-2xl space-y-3">
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                {round.batch} — Semester {round.semester}
              </h3>
              {subjects.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)]">No subjects defined for this semester yet.</p>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3">
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
              <button
                onClick={() => submit(round._id)}
                disabled={submitting === round._id}
                className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
              >
                {submitting === round._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Submit Choices
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
