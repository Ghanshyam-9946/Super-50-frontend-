import { useState, useEffect } from "react";
import { MessageSquareText, Loader2, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// One row per faculty+subject the student is rating, inside a pending form.
function FacultyBlock({ form, facultySubject, ratings, onRate }) {
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
            {form.questions.map((q) => (
              <tr key={q} className="border-t border-[var(--border-light)]">
                <td className="py-2 pr-2">{q}</td>
                {[5, 4, 3, 2, 1].map((n) => (
                  <td key={n} className="py-2 px-2 text-center">
                    <input
                      type="radio"
                      name={`${form._id}-${facultySubject.faculty._id}-${facultySubject.subjectName}-${q}`}
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
  const [pending, setPending] = useState([]); // [{form, facultySubjects}]
  const [ratingsByForm, setRatingsByForm] = useState({}); // formId -> { "facultyId::subjectName" -> { question: rating } }
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

  const rate = (formId, blockKey, question, value) => {
    setRatingsByForm((prev) => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [blockKey]: { ...prev[formId]?.[blockKey], [question]: value },
      },
    }));
  };

  const submit = async (entry) => {
    const { form, facultySubjects } = entry;
    const formRatings = ratingsByForm[form._id] || {};

    const answers = facultySubjects.map((fs) => {
      const blockKey = `${fs.faculty._id}::${fs.subjectName}`;
      const blockRatings = formRatings[blockKey] || {};
      return {
        faculty: fs.faculty._id,
        subjectCode: fs.subjectCode,
        subjectName: fs.subjectName,
        ratings: form.questions.map((q) => ({ question: q, rating: blockRatings[q] })),
      };
    });

    const incomplete = answers.some((a) => a.ratings.some((r) => !r.rating));
    if (incomplete) {
      return toast.error("Please rate every criterion for every faculty before submitting");
    }

    setSubmitting(form._id);
    try {
      const { data } = await api.post(`/feedback/${form._id}/submit`, { answers });
      if (data.success) {
        toast.success(data.message || "Feedback submitted");
        setPending((prev) => prev.filter((e) => e.form._id !== form._id));
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
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Rate each of your faculty on the criteria below.</p>
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
          <div key={entry.form._id} className="glass-card p-5 rounded-2xl space-y-4">
            <div>
              <h2 className="font-display font-bold text-base text-[var(--text-primary)]">{entry.form.title}</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {entry.form.batch} · Semester {entry.form.semester}
              </p>
            </div>
            {entry.facultySubjects.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No faculty/subject assignments found for you yet.</p>
            ) : (
              entry.facultySubjects.map((fs) => {
                const blockKey = `${fs.faculty._id}::${fs.subjectName}`;
                return (
                  <FacultyBlock
                    key={blockKey}
                    form={entry.form}
                    facultySubject={fs}
                    ratings={ratingsByForm[entry.form._id]?.[blockKey] || {}}
                    onRate={(q, v) => rate(entry.form._id, blockKey, q, v)}
                  />
                );
              })
            )}
            {entry.facultySubjects.length > 0 && (
              <button
                onClick={() => submit(entry)}
                disabled={submitting === entry.form._id}
                className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
              >
                {submitting === entry.form._id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit Feedback
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
