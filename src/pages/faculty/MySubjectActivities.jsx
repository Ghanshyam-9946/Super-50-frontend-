import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Loader2, Edit3, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const emptyActivity = () => ({ label: "", type: "tick", maxMarks: 0, unitWise: false, optional: false, deadline: null });
const toDateInputValue = (d) => (d ? String(d).slice(0, 10) : "");

// Lets a Subject Faculty (anyone with a FacultySectionMap row for a
// subject — not just the coordinator/admin) manage that subject's
// Activities, which drive both No Dues checklist items and Sessional
// Marks CA categories. Scoped server-side (PATCH /subjects/:id/activities)
// to only the subjects this faculty is actually assigned to teach.
export default function MySubjectActivities() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [co, setCo] = useState({ co1: "", co2: "", co3: "", co4: "", co5: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/subjects/mine");
      if (data.success) setSubjects(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (subject) => {
    setEditingId(subject._id);
    setActivities(subject.activities.map((a) => ({ ...a })));
    setCo({
      co1: subject.co1 || "", co2: subject.co2 || "", co3: subject.co3 || "",
      co4: subject.co4 || "", co5: subject.co5 || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setActivities([]);
    setCo({ co1: "", co2: "", co3: "", co4: "", co5: "" });
  };

  const addActivity = () => setActivities((prev) => [...prev, emptyActivity()]);
  const updateActivity = (idx, patch) =>
    setActivities((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const removeActivity = (idx) => setActivities((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/master-data/subjects/${editingId}/activities`, { activities, ...co });
      if (data.success) {
        toast.success("Assessment saved");
        cancelEdit();
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save activities");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <BookOpen size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">My Subjects — Assessment</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Manage Activities and Course Outcomes (NBA) for subjects you're assigned to teach — feeds No Dues checklists and Sessional Marks CA categories automatically.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          You aren't assigned to any subject yet — ask the coordinator to finalize your Choice Filling allocation.
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s._id} className="glass-card rounded-2xl px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {s.subjectName} {s.subjectCode && <span className="text-[var(--text-secondary)] font-medium">({s.subjectCode})</span>}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Sem {s.semester} · {s.activities.length} activit{s.activities.length === 1 ? "y" : "ies"}
                    {s.noOfPractical > 0 && " · Has Lab"}
                  </div>
                </div>
                {editingId !== s._id && (
                  <button onClick={() => startEdit(s)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
                    <Edit3 size={12} /> Manage Assessment
                  </button>
                )}
              </div>

              {editingId === s._id && (
                <div className="mt-4 space-y-4 border-t border-[var(--border-light)] pt-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Course Outcomes (NBA)</span>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">CO{n}</span>
                          <input
                            value={co[`co${n}`]}
                            onChange={(e) => setCo((prev) => ({ ...prev, [`co${n}`]: e.target.value }))}
                            placeholder={`Course Outcome ${n}`}
                            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Activities</span>
                    <button onClick={addActivity} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
                      <Plus size={12} /> Add Activity
                    </button>
                  </div>
                  {activities.length === 0 && <p className="text-xs text-[var(--text-secondary)]">No activities yet — add Assignment, Presentation, Lab, etc.</p>}
                  {activities.map((a, idx) => (
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
                  <div className="flex gap-2 pt-1">
                    <button onClick={save} disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Assessment"}
                    </button>
                    <button onClick={cancelEdit} className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
