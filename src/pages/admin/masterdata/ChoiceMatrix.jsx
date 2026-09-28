import { useState, useEffect } from "react";
import { Grid3x3, Loader2, Plus, Trash2, Send, RefreshCw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import BatchSelect from "../../../components/BatchSelect";
import SectionSelect from "../../../components/SectionSelect";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const PRIORITIES = [1, 2, 3, 4, 5];

const fmtDeadline = (d) =>
  new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

// A datetime-local input wants the local wall clock, not an ISO string.
const toLocalInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

export default function ChoiceMatrix() {
  const [filters, setFilters] = useState({ batch: "", semester: "" });
  const [batchOptions, setBatchOptions] = useState([]);
  const [releaseBatches, setReleaseBatches] = useState([]);
  const [releaseSemesters, setReleaseSemesters] = useState([]);
  // Optional last date/time faculty can fill. Once it passes, the round
  // disappears from every faculty account by itself.
  const [releaseDeadline, setReleaseDeadline] = useState("");
  const [roundDeadline, setRoundDeadline] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState(null); // {round, subjects, preferences}
  const [facultyList, setFacultyList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [rowForm, setRowForm] = useState({ subjectId: "", section: "", facultyId: "", support1FacultyId: "", support2FacultyId: "" });
  const [finalizing, setFinalizing] = useState(false);
  const [deletingRound, setDeletingRound] = useState(false);

  useEffect(() => {
    api
      .get("/master-data/batches")
      .then(({ data }) => {
        if (data.success) setBatchOptions(data.data);
      })
      .catch(() => {});
    api
      .get("/master-data/faculty-list")
      .then(({ data }) => {
        if (data.success) setFacultyList(data.data);
      })
      .catch(() => {});
  }, []);

  const toggleReleaseBatch = (b) =>
    setReleaseBatches((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const toggleReleaseSemester = (s) =>
    setReleaseSemesters((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const release = async () => {
    if (releaseBatches.length === 0 || releaseSemesters.length === 0) {
      return toast.error("Pick at least one batch and one semester to release");
    }
    setReleasing(true);
    try {
      const { data } = await api.post("/master-data/choice-filling/release", {
        batches: releaseBatches,
        semesters: releaseSemesters,
        deadline: releaseDeadline ? new Date(releaseDeadline) : null,
      });
      if (data.success) {
        toast.success(data.message || "Choice filling released to faculty");
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
      if (data.success) {
        setMatrix(data.data);
        // Keep the inline deadline editor showing what this round actually has.
        setRoundDeadline(toLocalInput(data.data.round?.deadline));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load matrix");
    } finally {
      setLoading(false);
    }
  };

  // Set, extend or clear the deadline of a round that is already out.
  // Extending a passed deadline brings the round back for everyone with
  // whatever faculty had already filled in still intact.
  const saveDeadline = async (value) => {
    setSavingDeadline(true);
    try {
      const { data } = await api.patch(`/master-data/choice-filling/rounds/${matrix.round._id}`, {
        deadline: value ? new Date(value) : null,
      });
      toast.success(value ? "Deadline saved" : "Deadline removed");
      setMatrix((m) => ({ ...m, round: { ...m.round, deadline: data.data.deadline } }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the deadline");
    } finally {
      setSavingDeadline(false);
    }
  };

  const deleteRound = async () => {
    if (!matrix?.round) return;
    if (!window.confirm("Delete this choice filling round? Every faculty's submitted preferences for it will be removed too — this batch/semester can then be released fresh.")) return;
    setDeletingRound(true);
    try {
      const { data } = await api.delete(`/master-data/choice-filling/rounds/${matrix.round._id}`);
      if (data.success) {
        toast.success(data.message);
        setMatrix(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete round");
    } finally {
      setDeletingRound(false);
    }
  };

  const picksFor = (subjectId) => (matrix?.preferences || []).filter((p) => p.subject?._id === subjectId);
  const selectedSubject = matrix?.subjects.find((s) => s._id === rowForm.subjectId);
  const selectedSubjectHasLab = (selectedSubject?.noOfPractical || 0) > 0;
  // Faculty who actually submitted a choice preference for the selected
  // subject — the Faculty dropdown below lists everyone (not just these),
  // but marks these with "(Chosen)" so that signal isn't lost.
  const pickedFacultyIds = new Set(picksFor(rowForm.subjectId).map((p) => p.faculty._id));

  const addAssignment = () => {
    if (!rowForm.subjectId || !rowForm.section || !rowForm.facultyId) {
      return toast.error("Pick subject, section and faculty");
    }
    const subject = matrix.subjects.find((s) => s._id === rowForm.subjectId);
    const faculty = facultyList.find((f) => f._id === rowForm.facultyId) || { _id: rowForm.facultyId, name: "(faculty)" };
    const support1Faculty = rowForm.support1FacultyId
      ? facultyList.find((f) => f._id === rowForm.support1FacultyId)
      : null;
    const support2Faculty = rowForm.support2FacultyId
      ? facultyList.find((f) => f._id === rowForm.support2FacultyId)
      : null;
    setAssignments((prev) => [
      ...prev,
      {
        ...rowForm,
        subjectName: subject.subjectName,
        facultyName: faculty.name,
        support1FacultyName: support1Faculty?.name || "",
        support2FacultyName: support2Faculty?.name || "",
      },
    ]);
    setRowForm({ subjectId: "", section: "", facultyId: "", support1FacultyId: "", support2FacultyId: "" });
  };

  const removeAssignment = (idx) => setAssignments((prev) => prev.filter((_, i) => i !== idx));

  // Past its deadline the round is closed for faculty no matter what
  // `isOpen` says — the backend stops serving it at that moment.
  const roundClosed = !!matrix?.round?.deadline && new Date(matrix.round.deadline) <= new Date();

  const finalize = async () => {
    if (assignments.length === 0) return toast.error("Add at least one assignment");
    setFinalizing(true);
    try {
      const { data } = await api.post("/master-data/choice-filling/finalize", {
        batch: filters.batch,
        semester: Number(filters.semester),
        assignments: assignments.map((a) => ({
          subjectId: a.subjectId,
          section: a.section,
          facultyId: a.facultyId,
          support1FacultyId: a.support1FacultyId || null,
          support2FacultyId: a.support2FacultyId || null,
        })),
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

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Release Choice Filling</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Pick every batch and semester to release at once. A batch/semester can only be released once — if it's already been released, delete that round first (below, after loading its matrix) before releasing it again.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Batches</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {batchOptions.map((b) => (
                <label
                  key={b.value}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                    releaseBatches.includes(b.value)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border-light)] text-[var(--text-primary)]"
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={releaseBatches.includes(b.value)} onChange={() => toggleReleaseBatch(b.value)} />
                  {b.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Semesters</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {SEMESTERS.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                    releaseSemesters.includes(s)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border-light)] text-[var(--text-primary)]"
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={releaseSemesters.includes(s)} onChange={() => toggleReleaseSemester(s)} />
                  Sem {s}
                </label>
              ))}
            </div>
          </div>
        </div>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1 max-w-xs">
          Deadline (optional)
          <input
            type="datetime-local"
            value={releaseDeadline}
            onChange={(e) => setReleaseDeadline(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)]"
          />
          <span className="text-[10px] font-medium normal-case tracking-normal text-[var(--text-secondary)]">
            At this moment the choice filling page clears itself from every faculty account. Leave it empty to keep the round open until you close it.
          </span>
        </label>
        <button onClick={release} disabled={releasing} className="btn-premium text-sm px-4 py-2 disabled:opacity-40">
          {releasing ? <Loader2 size={14} className="animate-spin" /> : "Release Choice Filling"}
        </button>
      </div>

      <div className="glass-card p-5 rounded-2xl flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Batch
          <BatchSelect value={filters.batch} onChange={(e) => setFilters((f) => ({ ...f, batch: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-40" />
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
              No choice filling round for this batch/semester yet — release it above.
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
              <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)] flex flex-wrap items-center gap-3 justify-between">
                <span>
                  Round {roundClosed ? "closed" : matrix.round.isOpen ? "open" : "closed"} · {matrix.subjects.length} subject(s)
                  {matrix.round.deadline && (
                    <span className={roundClosed ? "text-red-500 ml-1" : "ml-1"}>
                      · {roundClosed ? "deadline passed" : "closes"} {fmtDeadline(matrix.round.deadline)}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 font-normal">
                  <input
                    type="datetime-local"
                    value={roundDeadline}
                    onChange={(e) => setRoundDeadline(e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)]"
                  />
                  <button
                    onClick={() => saveDeadline(roundDeadline)}
                    disabled={savingDeadline || !roundDeadline}
                    className="font-bold text-[var(--primary)] disabled:opacity-40"
                  >
                    {savingDeadline ? <Loader2 size={13} className="animate-spin" /> : matrix.round.deadline ? "Change deadline" : "Set deadline"}
                  </button>
                  {matrix.round.deadline && (
                    <button onClick={() => { setRoundDeadline(""); saveDeadline(""); }} disabled={savingDeadline} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      Remove
                    </button>
                  )}
                </span>
                <button
                  onClick={deleteRound}
                  disabled={deletingRound}
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-600 disabled:opacity-40"
                  title="Delete this round so it can be released again"
                >
                  {deletingRound ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Delete Round
                </button>
              </div>
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                    <th className="px-4 py-3">Subject Name</th>
                    {PRIORITIES.map((p) => (
                      <th key={p} className="px-4 py-3">Priority {p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.subjects.map((s) => {
                    const picks = picksFor(s._id);
                    return (
                      <tr key={s._id} className="border-b border-[var(--border-light)] align-top">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">
                          {s.subjectName} {s.subjectCode && <span className="text-[var(--text-secondary)] font-medium">({s.subjectCode})</span>}
                        </td>
                        {PRIORITIES.map((priority) => {
                          const atPriority = picks.filter((p) => p.priority === priority);
                          return (
                            <td key={priority} className="px-4 py-3">
                              {atPriority.length === 0 ? (
                                <span className="text-xs text-[var(--text-secondary)]">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {atPriority.map((p) => (
                                    <span key={p._id} className="badge">
                                      {p.faculty?.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    onChange={(e) => setRowForm((f) => ({ ...f, subjectId: e.target.value, facultyId: "", support1FacultyId: "", support2FacultyId: "" }))}
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
                  <SectionSelect value={rowForm.section} onChange={(e) => setRowForm((f) => ({ ...f, section: e.target.value }))} />
                </label>
                <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                  Faculty
                  <select
                    value={rowForm.facultyId}
                    onChange={(e) => setRowForm((f) => ({ ...f, facultyId: e.target.value }))}
                    className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm min-w-[180px]"
                  >
                    <option value="">Select faculty</option>
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name}
                        {pickedFacultyIds.has(f._id) ? " (Chosen)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedSubjectHasLab && (
                  <>
                    <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                      Support 1 Faculty (optional)
                      <select
                        value={rowForm.support1FacultyId}
                        onChange={(e) => setRowForm((f) => ({ ...f, support1FacultyId: e.target.value }))}
                        className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm min-w-[180px]"
                      >
                        <option value="">None</option>
                        {facultyList.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
                      Support 2 Faculty (optional)
                      <select
                        value={rowForm.support2FacultyId}
                        onChange={(e) => setRowForm((f) => ({ ...f, support2FacultyId: e.target.value }))}
                        className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm min-w-[180px]"
                      >
                        <option value="">None</option>
                        {facultyList.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
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
                      {a.support1FacultyName && (
                        <span className="text-[var(--text-secondary)]">+ Support 1: {a.support1FacultyName}</span>
                      )}
                      {a.support2FacultyName && (
                        <span className="text-[var(--text-secondary)]">+ Support 2: {a.support2FacultyName}</span>
                      )}
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
