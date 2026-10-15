import { useState, useEffect } from "react";
import { MessageSquareText, Loader2, Send, CheckCircle2, BookOpen, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const PART_ICON = { theory: BookOpen, lab: FlaskConical };

// One row per faculty+subject the student is rating, inside one part
// (theory or lab) of a pending form.
function FacultyBlock({ groupName, questions, facultySubject, ratings, onRate }) {
  return (
    <div className="border border-[var(--border-light)] rounded-2xl p-4 space-y-3">
      <div className="font-bold text-sm text-[var(--text-primary)]">
        {facultySubject.faculty.name} — {facultySubject.subjectCode ? `${facultySubject.subjectCode} - ` : ""}
        {facultySubject.subjectName}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="text-left text-[var(--text-secondary)]">
              <th className="py-1.5 pr-2">Criteria</th>
              {[5, 4, 3, 2, 1].map((n) => (
                <th key={n} className="py-1.5 px-2 text-center">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q} className="border-t border-[var(--border-light)]">
                <td className="py-2 pr-2">{q}</td>
                {[5, 4, 3, 2, 1].map((n) => (
                  <td key={n} className="py-2 px-2 text-center">
                    <input
                      type="radio"
                      name={`${groupName}-${q}`}
                      checked={ratings[q] === n}
                      onChange={() => onRate(q, n)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]); // [{ form, parts: [{ kind, label, questions, facultySubjects, submitted }] }]
  // "formId|kind" -> { "facultyId::subjectName" -> { question: rating } }
  const [ratings, setRatings] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/feedback/my-forms");
      if (data.success) setPending(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load feedback forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rate = (partKey, blockKey, question, value) => {
    setRatings((prev) => ({
      ...prev,
      [partKey]: {
        ...prev[partKey],
        [blockKey]: { ...prev[partKey]?.[blockKey], [question]: value },
      },
    }));
  };

  // Theory and lab are sent on their own — filling one does not wait for
  // the other.
  const submit = async (form, part) => {
    const partKey = `${form._id}|${part.kind}`;
    const partRatings = ratings[partKey] || {};

    const answers = part.facultySubjects.map((fs) => {
      const blockRatings = partRatings[`${fs.faculty._id}::${fs.subjectName}`] || {};
      return {
        faculty: fs.faculty._id,
        subjectCode: fs.subjectCode,
        subjectName: fs.subjectName,
        ratings: part.questions.map((q) => ({ question: q, rating: blockRatings[q] })),
      };
    });

    if (answers.some((a) => a.ratings.some((r) => !r.rating))) {
      return toast.error(`Please rate every criterion for every faculty in the ${part.label} feedback before submitting`);
    }

    setSubmitting(partKey);
    try {
      const { data } = await api.post(`/feedback/${form._id}/submit`, { kind: part.kind, answers });
      if (data.success) {
        toast.success(data.message || "Feedback submitted");
        setPending((prev) =>
          prev
            .map((e) => (e.form._id !== form._id ? e : {
              ...e,
              parts: e.parts.map((p) => (p.kind === part.kind ? { ...p, submitted: true } : p)),
            }))
            .filter((e) => e.parts.some((p) => !p.submitted))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <MessageSquareText size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Faculty Feedback</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Rate your faculty for theory and for lab — the two are filled and submitted separately.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : pending.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)] flex flex-col items-center gap-2">
          <CheckCircle2 size={32} className="text-green-500" />
          No pending feedback forms right now.
        </div>
      ) : (
        pending.map((entry) => (
          <div key={entry.form._id} className="glass-card p-5 rounded-2xl space-y-5">
            <div>
              <h2 className="font-display font-bold text-base text-[var(--text-primary)]">{entry.form.title}</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {entry.form.batch} · Semester {entry.form.semester}
              </p>
            </div>
            {entry.parts.map((part) => {
              const partKey = `${entry.form._id}|${part.kind}`;
              const Icon = PART_ICON[part.kind] || BookOpen;
              return (
                <section key={part.kind} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-2">
                    <Icon size={16} className="text-[var(--primary)]" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{part.label} Feedback</h3>
                    {part.submitted && (
                      <span className="badge bg-green-500/10 text-green-500 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Submitted
                      </span>
                    )}
                  </div>
                  {part.submitted ? (
                    <p className="text-xs text-[var(--text-secondary)]">
                      You have submitted the {part.label.toLowerCase()} feedback. Thank you!
                    </p>
                  ) : (
                    <>
                      {part.facultySubjects.map((fs) => {
                        const blockKey = `${fs.faculty._id}::${fs.subjectName}`;
                        return (
                          <FacultyBlock
                            key={blockKey}
                            groupName={`${partKey}-${blockKey}`}
                            questions={part.questions}
                            facultySubject={fs}
                            ratings={ratings[partKey]?.[blockKey] || {}}
                            onRate={(q, v) => rate(partKey, blockKey, q, v)}
                          />
                        );
                      })}
                      <button
                        onClick={() => submit(entry.form, part)}
                        disabled={submitting === partKey}
                        className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                      >
                        {submitting === partKey ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit {part.label} Feedback
                      </button>
                    </>
                  )}
                </section>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
