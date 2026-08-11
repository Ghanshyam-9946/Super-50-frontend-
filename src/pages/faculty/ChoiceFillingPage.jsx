import { useState, useEffect } from "react";
import { ListChecks, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function ChoiceFillingPage() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({}); // roundId -> Set of subjectIds
  const [submitting, setSubmitting] = useState(null); // roundId currently submitting

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/choice-filling/my-round");
      if (data.success) {
        setRounds(data.data);
        const initial = {};
        data.data.forEach((r) => {
          initial[r.round._id] = new Set(r.myPickedSubjectIds);
        });
        setSelections(initial);
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

  const toggle = (roundId, subjectId) => {
    setSelections((prev) => {
      const set = new Set(prev[roundId]);
      if (set.has(subjectId)) set.delete(subjectId);
      else set.add(subjectId);
      return { ...prev, [roundId]: set };
    });
  };

  const submit = async (roundId) => {
    setSubmitting(roundId);
    try {
      const { data } = await api.post("/master-data/choice-filling/submit", {
        roundId,
        subjectIds: [...(selections[roundId] || [])],
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
            Pick the subjects you'd like to teach — the coordinator finalizes the actual allocation.
          </p>
        </div>
      </header>

      {rounds.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No choice filling rounds are open right now.
        </div>
      ) : (
        rounds.map(({ round, subjects }) => (
          <div key={round._id} className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
              {round.batch} — Semester {round.semester}
            </h3>
            {subjects.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No subjects defined for this semester yet.</p>
            ) : (
              <div className="space-y-1.5">
                {subjects.map((s) => (
                  <label
                    key={s._id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-[var(--bg-hover)]"
                  >
                    <input
                      type="checkbox"
                      checked={selections[round._id]?.has(s._id) || false}
                      onChange={() => toggle(round._id, s._id)}
                    />
                    <span className="font-bold text-[var(--text-primary)]">{s.subjectName}</span>
                    {s.subjectCode && <span className="text-[var(--text-secondary)] text-xs">({s.subjectCode})</span>}
                  </label>
                ))}
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
        ))
      )}
    </div>
  );
}
