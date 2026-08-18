import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BookOpen, Plus, Trash2, Loader2, Edit3, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyActivity = () => ({ label: "", type: "tick", maxMarks: 0, unitWise: false, optional: false, deadline: null });
const emptyForm = () => ({ subjectName: "", subjectCode: "", semester: "", noOfLectures: 0, noOfTheory: 0, noOfPractical: 0, activities: [] });
// <input type="date"> needs "YYYY-MM-DD" — activity.deadline comes back
// from the API as a full ISO string (or is null if never set).
const toDateInputValue = (d) => (d ? String(d).slice(0, 10) : "");

export default function Subjects() {
  const { user } = useSelector((s) => s.auth);
  const [subjects, setSubjects] = useState([]);
  const [semFilter, setSemFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/subjects", { params: { semester: semFilter || undefined } });
      if (data.success) setSubjects(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  // One-time migration: creates Subject Catalog entries from any existing
  // No Dues forms / Sessional Marks sheets that still use free-text
  // subjects, and links them via subjectRef — safe to run more than once,
  // never deletes or overwrites anything (see masterDataController.js's
  // backfillSubjectCatalog for exactly what it touches).
  const runBackfill = async () => {
    if (!window.confirm('Scan existing No Dues forms and Sessional Marks sheets and create Subject Catalog entries for any subjects not in it yet? Nothing existing is deleted or changed — this only adds new catalog entries and links old records to them.')) return;
    setBackfilling(true);
    try {
      const { data } = await api.post("/master-data/backfill-subject-catalog");
      if (data.success) {
        toast.success(
          `${data.data.subjectsCreated} subject(s) created, ${data.data.noDuesFormsLinked} No Dues form(s) and ${data.data.sessionalSheetsLinked} Sessional sheet(s) linked`,
        );
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Backfill failed");
    } finally {
      setBackfilling(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semFilter]);

  const addActivity = () => setForm((f) => ({ ...f, activities: [...f.activities, emptyActivity()] }));
  const updateActivity = (idx, patch) =>
    setForm((f) => ({ ...f, activities: f.activities.map((a, i) => (i === idx ? { ...a, ...patch } : a)) }));
  const removeActivity = (idx) => setForm((f) => ({ ...f, activities: f.activities.filter((_, i) => i !== idx) }));

  const startEdit = (subject) => {
    setEditingId(subject._id);
    setForm({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode || "",
      semester: String(subject.semester),
      noOfLectures: subject.noOfLectures || 0,
      noOfTheory: subject.noOfTheory || 0,
      noOfPractical: subject.noOfPractical || 0,
      activities: subject.activities.map((a) => ({ ...a })),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const submit = async () => {
    if (!form.subjectName.trim() || !form.semester) return toast.error("Subject name and semester are required");
    setSaving(true);
    try {
      const payload = { ...form, semester: Number(form.semester) };
      const { data } = editingId
        ? await api.put(`/master-data/subjects/${editingId}`, payload)
        : await api.post("/master-data/subjects", payload);
      if (data.success) {
        toast.success(editingId ? "Subject updated" : "Subject created");
        cancelEdit();
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this subject? This does not affect No Dues forms or Sessional Marks sheets already created.")) return;
    try {
      await api.delete(`/master-data/subjects/${id}`);
      toast.success("Subject deleted");
      if (editingId === id) cancelEdit();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete subject");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <BookOpen size={26} />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Create Subjects</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Subjects and their activities feed No Dues checklists and Sessional Marks CA categories automatically.
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={runBackfill}
            disabled={backfilling}
            title="Create catalog entries for subjects already used in existing No Dues forms / Sessional Marks sheets"
            className="shrink-0 flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-40"
          >
            {backfilling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Backfill from Existing Data
          </button>
        )}
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-4">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{editingId ? "Edit Subject" : "New Subject"}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="Subject Name"
            value={form.subjectName}
            onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))}
            className="lg:col-span-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Subject Code"
            value={form.subjectCode}
            onChange={(e) => setForm((f) => ({ ...f, subjectCode: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.semester}
            onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semester</option>
            {SEMESTERS.map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="No. of Lectures"
            value={form.noOfLectures}
            onChange={(e) => setForm((f) => ({ ...f, noOfLectures: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="No. of Theory"
            value={form.noOfTheory}
            onChange={(e) => setForm((f) => ({ ...f, noOfTheory: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <input
          type="number"
          min="0"
          placeholder="No. of Practical (>0 gives this subject a Lab score in Sessional Marks)"
          value={form.noOfPractical}
          onChange={(e) => setForm((f) => ({ ...f, noOfPractical: e.target.value }))}
          className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full sm:w-96"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Activities</span>
            <button onClick={addActivity} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
              <Plus size={12} /> Add Activity
            </button>
          </div>
          {form.activities.length === 0 && <p className="text-xs text-[var(--text-secondary)]">No activities yet — add Assignment, Presentation, Lab, etc.</p>}
          {form.activities.map((a, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-2.5">
              <input
                placeholder="Label (e.g. Presentation)"
                value={a.label}
                onChange={(e) => updateActivity(idx, { label: e.target.value })}
                className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs flex-1 min-w-[140px]"
              />
              <select
                value={a.type}
                onChange={(e) => updateActivity(idx, { type: e.target.value })}
                className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="tick">Tick (No Dues)</option>
                <option value="marks">Marks (Sessional)</option>
              </select>
              {a.type === "marks" && (
                <>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max marks"
                    value={a.maxMarks}
                    onChange={(e) => updateActivity(idx, { maxMarks: Number(e.target.value) })}
                    className="w-24 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    Deadline
                    <input
                      type="date"
                      value={toDateInputValue(a.deadline)}
                      onChange={(e) => updateActivity(idx, { deadline: e.target.value || null })}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </label>
                </>
              )}
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <input type="checkbox" checked={a.unitWise} onChange={(e) => updateActivity(idx, { unitWise: e.target.checked })} /> Unit-wise
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <input type="checkbox" checked={a.optional} onChange={(e) => updateActivity(idx, { optional: e.target.checked })} /> Optional
              </label>
              <button onClick={() => removeActivity(idx)} className="ml-auto">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={submit} disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : editingId ? "Save Changes" : "Create Subject"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5">
              <X size={14} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Filter</span>
        <select
          value={semFilter}
          onChange={(e) => setSemFilter(e.target.value)}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none"
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((n) => (
            <option key={n} value={n}>
              Semester {n}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">No subjects yet.</div>
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s._id} className="glass-card rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">
                  {s.subjectName} {s.subjectCode && <span className="text-[var(--text-secondary)] font-medium">({s.subjectCode})</span>}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Sem {s.semester} · {s.activities.length} activit{s.activities.length === 1 ? "y" : "ies"}
                  {s.noOfPractical > 0 && " · Has Lab"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(s)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={() => remove(s._id)}>
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
