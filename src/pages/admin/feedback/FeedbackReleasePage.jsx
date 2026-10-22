import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Loader2, Send, BarChart3, Plus, Trash2, Pencil, Save, X, BookOpen, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import BatchSelect from "../../../components/BatchSelect";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm";

const cleaned = (list) => list.map((q) => q.trim()).filter(Boolean);

// One list of questions — theory's or lab's. `locked` is the number of
// students who have already answered it; once that is above zero the
// wording can no longer change, so the list is shown read-only.
function QuestionEditor({ icon: Icon, title, hint, questions, onChange, locked = 0 }) {
  return (
    <div className="border border-[var(--border-light)] rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-[var(--primary)]" />
        <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">{title}</h4>
        <span className="text-[11px] text-[var(--text-secondary)]">{questions.length} question(s)</span>
      </div>
      <p className="text-[11px] text-[var(--text-secondary)]">{hint}</p>
      {locked > 0 ? (
        <>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-[var(--text-primary)]">
            {questions.map((q) => <li key={q}>{q}</li>)}
          </ol>
          <p className="text-[11px] text-amber-600">
            {locked} student(s) have already answered these, so they can no longer be changed.
          </p>
        </>
      ) : (
        <>
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] w-5 text-right shrink-0">{i + 1}.</span>
              <input
                value={q}
                onChange={(e) => onChange(questions.map((x, n) => (n === i ? e.target.value : x)))}
                placeholder="Write the question"
                className={`${inputCls} flex-1 min-w-0`}
              />
              <button
                type="button"
                onClick={() => onChange(questions.filter((_, n) => n !== i))}
                title="Remove this question"
                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...questions, ""])}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <Plus size={13} /> Add a question
          </button>
        </>
      )}
    </div>
  );
}

export default function FeedbackReleasePage() {
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [sectionOptions, setSectionOptions] = useState([]);
  const [sections, setSections] = useState([]);
  // The questions for this release. They start as the standard lists and
  // the admin rewrites them as needed — theory and lab separately.
  const [defaults, setDefaults] = useState({ theory: [], lab: [] });
  const [theoryQs, setTheoryQs] = useState([]);
  const [labQs, setLabQs] = useState([]);
  const [releasing, setReleasing] = useState(false);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  // The past release being edited: { _id, title, questions, labQuestions, theoryCount, labCount }
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/feedback/releases");
      if (data.success) setReleases(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load releases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get("/master-data/sections")
      .then(({ data }) => {
        if (data.success) setSectionOptions(data.data);
      })
      .catch(() => {});
    api
      .get("/feedback/default-questions")
      .then(({ data }) => {
        if (!data.success) return;
        setDefaults(data.data);
        setTheoryQs(data.data.theory);
        setLabQs(data.data.lab);
      })
      .catch(() => {});
    loadReleases();
  }, []);

  const toggleSection = (s) =>
    setSections((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const release = async () => {
    if (!title.trim() || !batch || !semester || sections.length === 0) {
      return toast.error("Title, batch, semester and at least one section are required");
    }
    const questions = cleaned(theoryQs);
    const labQuestions = cleaned(labQs);
    if (!questions.length) return toast.error("Add at least one theory question");
    if (!labQuestions.length) return toast.error("Add at least one lab question");
    setReleasing(true);
    try {
      const { data } = await api.post("/feedback/release", {
        title: title.trim(), batch, semester: Number(semester), sections, questions, labQuestions,
      });
      if (data.success) {
        toast.success(data.message || "Feedback form released");
        setTitle("");
        setSections([]);
        loadReleases();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to release");
    } finally {
      setReleasing(false);
    }
  };

  const saveEdit = async () => {
    if (!editing.title.trim()) return toast.error("The title cannot be empty");
    const body = { title: editing.title.trim() };
    // A list students have already answered is frozen — it is not sent.
    if (!editing.theoryCount) body.questions = cleaned(editing.questions);
    if (!editing.labCount) body.labQuestions = cleaned(editing.labQuestions);
    if (body.questions && !body.questions.length) return toast.error("Add at least one theory question");
    if (body.labQuestions && !body.labQuestions.length) return toast.error("Add at least one lab question");
    setSaving(true);
    try {
      const { data } = await api.put(`/feedback/releases/${editing._id}`, body);
      toast.success(data.message || "Release updated");
      setEditing(null);
      loadReleases();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the changes");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate this release? Students will no longer see it in their pending forms.")) return;
    try {
      const { data } = await api.patch(`/feedback/releases/${id}/deactivate`);
      if (data.success) {
        toast.success(data.message);
        loadReleases();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <MessageSquareText size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Faculty Feedback</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Release a feedback form to a batch, semester and one or more sections. You write the questions — one set for
            theory, one for lab — and each student fills the two separately.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-4">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Release Feedback Form</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Semester Faculty Feedback"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Batch
            <BatchSelect value={batch} onChange={(e) => setBatch(e.target.value)} />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Semester
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className={inputCls}>
              <option value="">Select</option>
              {SEMESTERS.map((n) => (
                <option key={n} value={n}>
                  Semester {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Sections</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {sectionOptions.map((s) => (
              <label
                key={s}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                  sections.includes(s)
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--border-light)] text-[var(--text-primary)]"
                }`}
              >
                <input type="checkbox" className="hidden" checked={sections.includes(s)} onChange={() => toggleSection(s)} />
                Section {s}
              </label>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <QuestionEditor
            icon={BookOpen}
            title="Theory questions"
            hint="Asked about each faculty for the lecture classes. Rated 1 to 5."
            questions={theoryQs}
            onChange={setTheoryQs}
          />
          <QuestionEditor
            icon={FlaskConical}
            title="Lab questions"
            hint="Asked about each faculty for the practical classes — only for subjects that have a lab."
            questions={labQs}
            onChange={setLabQs}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={release} disabled={releasing} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {releasing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Release
          </button>
          <button
            type="button"
            onClick={() => { setTheoryQs(defaults.theory); setLabQs(defaults.lab); }}
            className="btn-outline-premium text-xs px-3 py-2"
          >
            Reset to the standard questions
          </button>
        </div>
      </div>

      {editing && (
        <div className="glass-card p-5 rounded-2xl space-y-4 border border-[var(--primary)]/40">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Edit release</h3>
            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-[var(--border-light)]" title="Close">
              <X size={16} />
            </button>
          </div>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1 max-w-md">
            Title
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} />
          </label>
          <div className="grid lg:grid-cols-2 gap-4">
            <QuestionEditor
              icon={BookOpen}
              title="Theory questions"
              hint="Asked about each faculty for the lecture classes."
              questions={editing.questions}
              onChange={(list) => setEditing({ ...editing, questions: list })}
              locked={editing.theoryCount}
            />
            <QuestionEditor
              icon={FlaskConical}
              title="Lab questions"
              hint="Asked about each faculty for the practical classes."
              questions={editing.labQuestions}
              onChange={(list) => setEditing({ ...editing, labQuestions: list })}
              locked={editing.labCount}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveEdit} disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline-premium text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
          Past Releases
        </div>
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-[var(--primary)]" />
          </div>
        ) : releases.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No feedback forms released yet.</div>
        ) : (
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Batch / Sem / Sections</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Responses</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r._id} className="border-b border-[var(--border-light)]">
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{r.title}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {r.batch} · Sem {r.semester} · {r.sections.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                    Theory {r.questions.length} · Lab {r.labQuestions.length}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>{r.responseCount} / {r.eligibleCount} students</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Theory {r.theoryCount} · Lab {r.labCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.isActive ? (
                      <span className="badge bg-green-500/10 text-green-500">Active</span>
                    ) : (
                      <span className="badge bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/feedback/${r._id}`}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]"
                      >
                        <BarChart3 size={12} /> Report
                      </Link>
                      <button
                        onClick={() => {
                          setEditing({
                            _id: r._id, title: r.title, questions: [...r.questions], labQuestions: [...r.labQuestions],
                            theoryCount: r.theoryCount, labCount: r.labCount,
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      {r.isActive && (
                        <button
                          onClick={() => deactivate(r._id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-red-500"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
