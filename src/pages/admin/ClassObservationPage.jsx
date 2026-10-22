import { useState, useEffect } from "react";
import { ClipboardCheck, Loader2, Plus, Trash2, Edit3, Download, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const RATING_FIELDS = [
  ["timeManagement", "Time Management"],
  ["punctuality", "Punctuality (Arrival in class on time)"],
  ["contentPreparedness", "Content — Preparedness of Topic Taught"],
  ["contentAbilityToExplain", "Content — Ability to Explain"],
  ["contentRelevantExamples", "Content — Relevant Examples"],
  ["conductBodyLanguage", "Conduct — Body Language"],
  ["conductPositiveAttitude", "Conduct — Positive Attitude"],
  ["conductCommunication", "Conduct — Communication"],
  ["conductCommandOnLanguage", "Conduct — Command on Language"],
  ["studentsSatisfactionLevel", "Students Satisfaction Level"],
  ["modeOfTeachingParticipation", "Mode of Teaching (Encouraging Participation)"],
];

const emptyForm = () => ({
  date: "",
  time: "",
  branch: "",
  semester: "",
  subjectName: "",
  facultyName: "",
  studentsPresent: "",
  topicCovered: "",
  observations: "",
  ratings: {},
  overallRating: "",
  overallComments: "",
});

export default function ClassObservationPage() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ branch: "", semester: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.branch) params.branch = filters.branch;
      if (filters.semester) params.semester = filters.semester;
      const { data } = await api.get("/class-observations", { params });
      if (data.success) setObservations(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load observations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.branch, filters.semester]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const startEdit = (o) => {
    setEditingId(o._id);
    setForm({
      date: o.date ? String(o.date).slice(0, 10) : "",
      time: o.time || "",
      branch: o.branch || "",
      semester: o.semester || "",
      subjectName: o.subjectName || "",
      facultyName: o.facultyName || "",
      studentsPresent: o.studentsPresent ?? "",
      topicCovered: o.topicCovered || "",
      observations: o.observations || "",
      ratings: { ...o.ratings },
      overallRating: o.overallRating ?? "",
      overallComments: o.overallComments || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const save = async () => {
    if (!form.date || !form.branch || !form.semester || !form.subjectName || !form.facultyName) {
      return toast.error("Date, branch, semester, subject and faculty are required");
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        semester: Number(form.semester),
        studentsPresent: form.studentsPresent === "" ? null : Number(form.studentsPresent),
        overallRating: form.overallRating === "" ? null : Number(form.overallRating),
      };
      const { data } = editingId
        ? await api.put(`/class-observations/${editingId}`, payload)
        : await api.post("/class-observations", payload);
      if (data.success) {
        toast.success(data.message);
        cancelForm();
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save observation");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this class observation record?")) return;
    try {
      const { data } = await api.delete(`/class-observations/${id}`);
      if (data.success) {
        toast.success(data.message);
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete observation");
    }
  };

  const downloadPdf = async (o) => {
    setDownloadingId(o._id);
    try {
      const response = await api.get(`/class-observations/${o._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Class-Observation-${o.facultyName}-${o.date?.slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ClipboardCheck size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Class Observation Form</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Record and review class observations conducted by admin.</p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Branch
          <input
            value={filters.branch}
            onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            placeholder="e.g. CSE"
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-32"
          />
        </label>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Semester
          <input
            type="number"
            min="1"
            max="8"
            value={filters.semester}
            onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-24"
          />
        </label>
        <button onClick={startCreate} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 ml-auto">
          <Plus size={14} /> New Observation
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
              {editingId ? "Edit Observation" : "New Observation"}
            </h3>
            <button onClick={cancelForm}>
              <X size={16} />
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Date
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Time
              <input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="e.g. 11:00 AM" className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Branch
              <input value={form.branch} onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Semester
              <input type="number" min="1" max="8" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Subject
              <input value={form.subjectName} onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Faculty
              <input value={form.facultyName} onChange={(e) => setForm((f) => ({ ...f, facultyName: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Students Present
              <input type="number" min="0" value={form.studentsPresent} onChange={(e) => setForm((f) => ({ ...f, studentsPresent: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1 sm:col-span-2">
              Topic Covered
              <input value={form.topicCovered} onChange={(e) => setForm((f) => ({ ...f, topicCovered: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>

          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Observations / Comments
            <textarea
              value={form.observations}
              onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
              rows={2}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            />
          </label>

          <div>
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Rating Criteria (1-5)</span>
            <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
              {RATING_FIELDS.map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-2 text-xs bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-lg px-3 py-2">
                  {label}
                  <select
                    value={form.ratings[key] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ratings: { ...f.ratings, [key]: e.target.value === "" ? null : Number(e.target.value) } }))
                    }
                    className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Overall Rating (1-5)
              <select
                value={form.overallRating}
                onChange={(e) => setForm((f) => ({ ...f, overallRating: e.target.value }))}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Overall Comments
              <input value={form.overallComments} onChange={(e) => setForm((f) => ({ ...f, overallComments: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>

          <button onClick={save} disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : editingId ? "Update Observation" : "Save Observation"}
          </button>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-[var(--primary)]" />
          </div>
        ) : observations.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No class observations recorded yet.</div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Branch / Sem</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Overall</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr key={o._id} className="border-b border-[var(--border-light)]">
                  <td className="px-4 py-3">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {o.branch} · Sem {o.semester}
                  </td>
                  <td className="px-4 py-3">{o.subjectName}</td>
                  <td className="px-4 py-3">{o.facultyName}</td>
                  <td className="px-4 py-3">{o.overallRating ? `${o.overallRating} / 5` : "—"}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button onClick={() => startEdit(o)} className="p-1.5 rounded-lg border border-[var(--border-light)]">
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => downloadPdf(o)}
                      disabled={downloadingId === o._id}
                      className="p-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
                    >
                      {downloadingId === o._id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    </button>
                    <button onClick={() => remove(o._id)} className="p-1.5 rounded-lg border border-[var(--border-light)] text-red-500">
                      <Trash2 size={12} />
                    </button>
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
