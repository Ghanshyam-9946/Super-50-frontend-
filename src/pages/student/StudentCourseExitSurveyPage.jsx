import { useState, useEffect } from "react";
import { ClipboardCheck, Loader2, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const SCALE = [
  { value: 5, label: "Strongly Agree" },
  { value: 4, label: "Agree" },
  { value: 3, label: "Neutral" },
  { value: 2, label: "Disagree" },
  { value: 1, label: "Strongly Disagree" },
];

// One row per subject the student is rating, inside a pending survey.
function SubjectBlock({ release, subject, ratings, onRate }) {
  return (
    <div className="border border-[var(--border-light)] rounded-2xl p-4 space-y-3">
      <div className="font-bold text-sm text-[var(--text-primary)]">
        {subject.subjectCode ? `${subject.subjectCode} - ` : ""}
        {subject.subjectName}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[620px]">
          <thead>
            <tr className="text-left text-[var(--text-secondary)]">
              <th className="py-1.5 pr-2">Statement</th>
              {SCALE.map((s) => (
                <th key={s.value} className="py-1.5 px-2 text-center">
                  {s.label} ({s.value})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subject.questions.map((q) => (
              <tr key={q} className="border-t border-[var(--border-light)]">
                <td className="py-2 pr-2">{q}</td>
                {SCALE.map((s) => (
                  <td key={s.value} className="py-2 px-2 text-center">
                    <input
                      type="radio"
                      name={`${release._id}-${subject._id}-${q}`}
                      checked={ratings[q] === s.value}
                      onChange={() => onRate(q, s.value)}
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

export default function StudentCourseExitSurveyPage() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]); // [{release, subjects}]
  const [ratingsByRelease, setRatingsByRelease] = useState({}); // releaseId -> subjectId -> { question: rating }
  const [submitting, setSubmitting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/course-exit-survey/my-forms");
      if (data.success) setPending(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rate = (releaseId, subjectId, question, value) => {
    setRatingsByRelease((prev) => ({
      ...prev,
      [releaseId]: {
        ...prev[releaseId],
        [subjectId]: { ...prev[releaseId]?.[subjectId], [question]: value },
      },
    }));
  };

  const submit = async (entry) => {
    const { release, subjects } = entry;
    const releaseRatings = ratingsByRelease[release._id] || {};

    const answers = subjects.map((subject) => {
      const subjectRatings = releaseRatings[subject._id] || {};
      return {
        subject: subject._id,
        ratings: subject.questions.map((q) => ({ question: q, rating: subjectRatings[q] })),
      };
    });

    const incomplete = answers.some((a) => a.ratings.some((r) => !r.rating));
    if (incomplete) {
      return toast.error("Please rate every statement for every subject before submitting");
    }

    setSubmitting(release._id);
    try {
      const { data } = await api.post(`/course-exit-survey/${release._id}/submit`, { answers });
      if (data.success) {
        toast.success(data.message || "Survey submitted");
        setPending((prev) => prev.filter((e) => e.release._id !== release._id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit survey");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ClipboardCheck size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Course Exit Survey</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Rate each subject on the statements below.</p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : pending.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)] flex flex-col items-center gap-2">
          <CheckCircle2 size={32} className="text-green-500" />
          No pending Course Exit Surveys right now.
        </div>
      ) : (
        pending.map((entry) => (
          <div key={entry.release._id} className="glass-card p-5 rounded-2xl space-y-4">
            <div>
              <h2 className="font-display font-bold text-base text-[var(--text-primary)]">{entry.release.title}</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {entry.release.batch} · Semester {entry.release.semester}
              </p>
            </div>
            {entry.subjects.map((subject) => (
              <SubjectBlock
                key={subject._id}
                release={entry.release}
                subject={subject}
                ratings={ratingsByRelease[entry.release._id]?.[subject._id] || {}}
                onRate={(q, v) => rate(entry.release._id, subject._id, q, v)}
              />
            ))}
            <button
              onClick={() => submit(entry)}
              disabled={submitting === entry.release._id}
              className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
            >
              {submitting === entry.release._id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit Survey
            </button>
          </div>
        ))
      )}
    </div>
  );
}
