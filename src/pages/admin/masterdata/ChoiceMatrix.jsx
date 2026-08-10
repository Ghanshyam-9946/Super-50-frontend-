import { useState } from "react";
import { Grid3x3, Loader2, Plus, Trash2, Send, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ChoiceMatrix() {
  const [filters, setFilters] = useState({ batch: "", semester: "" });
  const [releasing, setReleasing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState(null); // {round, subjects, preferences}
  const [assignments, setAssignments] = useState([]);
  const [rowForm, setRowForm] = useState({ subjectId: "", section: "", facultyId: "" });
  const [finalizing, setFinalizing] = useState(false);

  const release = async () => {
    if (!filters.batch || !filters.semester) return toast.error("Enter batch and semester first");
    setReleasing(true);
    try {
      const { data } = await api.post("/master-data/choice-filling/release", {
        batch: filters.batch,
        semester: Number(filters.semester),
      });
      if (data.success) {
        toast.success("Choice filling released to faculty");
        loadMatrix();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to release");
    } finally {
      setReleasing(false);
    }
  };

  const loadMatrix = async () => {
    if (!filters.batch || !filters.semester) return toast.error("Enter batch and semester first");
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/choice-filling/matrix", {
        params: { batch: filters.batch, semester: filters.semester },
      });
      if (data.success) setMatrix(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load matrix");
    } finally {
      setLoading(false);
    }
  };

  const picksFor = (subjectId) => (matrix?.preferences || []).filter((p) => p.subject?._id === subjectId);

  const addAssignment = () => {
    if (!rowForm.subjectId || !rowForm.section || !rowForm.facultyId) {
      return toast.error("Pick subject, section and faculty");
    }
    const subject = matrix.subjects.find((s) => s._id === rowForm.subjectId);
    const faculty = picksFor(rowForm.subjectId).find((p) => p.faculty._id === rowForm.facultyId)?.faculty
      || { _id: rowForm.facultyId, name: "(picked faculty)" };
    setAssignments((prev) => [...prev, { ...rowForm, subjectName: subject.subjectName, facultyName: faculty.name }]);
    setRowForm({ subjectId: "", section: "", facultyId: "" });
  };

  const removeAssignment = (idx) => setAssignments((prev) => prev.filter((_, i) => i !== idx));

  const finalize = async () => {
    if (assignments.length === 0) return toast.error("Add at least one assignment");
    setFinalizing(true);
    try {
      const { data } = await api.post("/master-data/choice-filling/finalize", {
        batch: filters.batch,
        semester: Number(filters.semester),
        assignments: assignments.map((a) => ({ subjectId: a.subjectId, section: a.section, facultyId: a.facultyId })),
      });
      if (data.success) {
        toast.success(data.message);
        setAssignments([]);
        loadMatrix();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <Grid3x3 size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Choice Filling Matrix</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Release choice filling, see who picked what, then finalize the actual section-wise allocation.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Batch
          <input
            value={filters.batch}
            onChange={(e) => setFilters((f) => ({ ...f, batch: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-40"
          />
        </label>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Semester
          <select
            value={filters.semester}
            onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
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
        <button onClick={release} disabled={releasing} className="btn-premium text-sm px-4 py-2 disabled:opacity-40">
          {releasing ? <Loader2 size={14} className="animate-spin" /> : "Release Choice Filling"}
        </button>
        <button
          onClick={loadMatrix}
          disabled={loading}
          className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Load Matrix
        </button>
      </div>

      {matrix && (
        <>
          {!matrix.round ? (
            <div className="glass-card p-10 text-center rounded-3xl text-[var(--text-secondary)]">
              No choice filling round for this batch/semester yet — click "Release Choice Filling" above.
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
                Round {matrix.round.isOpen ? "open" : "closed"} · {matrix.subjects.length} subject(s)
              </div>
              <div className="divide-y divide-[var(--border-light)]">
                {matrix.subjects.map((s) => {
                  const picks = picksFor(s._id);
                  return (
                    <div key={s._id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-bold text-[var(--text-primary)] min-w-[180px]">
                        {s.subjectName} {s.subjectCode && <span className="text-[var(--text-secondary)] font-medium">({s.subjectCode})</span>}
                      </span>
                      {picks.length === 0 ? (
                        <span className="text-xs text-[var(--text-secondary)]">No preferences yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {picks.map((p) => (
                            <span key={p._id} className="badge">
                              {p.faculty?.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matrix.subjects.length > 0 && (
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Finalize Allocation</h3>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                  Subject
                  <select
                    value={rowForm.subjectId}
                    onChange={(e) => setRowForm((f) => ({ ...f, subjectId: e.target.value, facultyId: "" }))}
                    className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm min-w-[200px]"
                  >
                    <option value="">Select subject</option>
                    {matrix.subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.subjectName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                  Section
                  <select
                    value={rowForm.section}
                    onChange={(e) => setRowForm((f) => ({ ...f, section: e.target.value }))}
                    className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                  Faculty
                  <select
                    value={rowForm.facultyId}
                    onChange={(e) => setRowForm((f) => ({ ...f, facultyId: e.target.value }))}
                    className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm min-w-[180px]"
                  >
                    <option value="">Select faculty</option>
                    {picksFor(rowForm.subjectId).map((p) => (
                      <option key={p.faculty._id} value={p.faculty._id}>
                        {p.faculty.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button onClick={addAssignment} className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5">
                  <Plus size={14} /> Add
                </button>
              </div>

              {assignments.length > 0 && (
                <div className="space-y-1.5">
                  {assignments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[var(--bg-input)] rounded-lg px-3 py-2 text-xs">
                      <span className="font-bold text-[var(--text-primary)]">{a.subjectName}</span>
                      <span>Section {a.section}</span>
                      <span className="text-[var(--text-secondary)]">→ {a.facultyName}</span>
                      <button onClick={() => removeAssignment(idx)} className="ml-auto">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={finalize}
                    disabled={finalizing}
                    className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {finalizing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Finalize {assignments.length} Assignment(s)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
