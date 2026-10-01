import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Loader2, Send, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import BatchSelect from "../../../components/BatchSelect";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function FeedbackReleasePage() {
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [sectionOptions, setSectionOptions] = useState([]);
  const [sections, setSections] = useState([]);
  const [releasing, setReleasing] = useState(false);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

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
    loadReleases();
  }, []);

  const toggleSection = (s) =>
    setSections((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const release = async () => {
    if (!title.trim() || !batch || !semester || sections.length === 0) {
      return toast.error("Title, batch, semester and at least one section are required");
    }
    setReleasing(true);
    try {
      const { data } = await api.post("/feedback/release", { title: title.trim(), batch, semester: Number(semester), sections });
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
            Release a feedback form to a batch, semester and one or more sections — each student rates their own faculty per subject.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Release Feedback Form</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Semester Faculty Feedback"
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Batch
            <BatchSelect value={batch} onChange={(e) => setBatch(e.target.value)} />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Semester
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            >
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
        <button onClick={release} disabled={releasing} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {releasing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Release
        </button>
      </div>

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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Batch / Sem / Sections</th>
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
                  <td className="px-4 py-3">
                    {r.responseCount} / {r.eligibleCount}
                  </td>
                  <td className="px-4 py-3">
                    {r.isActive ? (
                      <span className="badge bg-green-500/10 text-green-500">Active</span>
                    ) : (
                      <span className="badge bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Link
                      to={`/admin/feedback/${r._id}`}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]"
                    >
                      <BarChart3 size={12} /> Dashboard
                    </Link>
                    {r.isActive && (
                      <button
                        onClick={() => deactivate(r._id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-red-500"
                      >
                        Deactivate
                      </button>
                    )}
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
