import { useState, useEffect } from "react";
import { UserCheck, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Mentors() {
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({ mentorId: "", batch: "", semester: "", section: "" });
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    api
      .get("/master-data/faculty-list")
      .then(({ data }) => {
        if (data.success) setFaculty(data.data);
      })
      .catch(() => {});
  }, []);

  const loadPreview = async () => {
    if (!form.batch || !form.semester || !form.section) {
      return toast.error("Fill batch, semester and section first");
    }
    setLoadingPreview(true);
    try {
      const { data } = await api.get("/master-data/students", {
        params: { batch: form.batch, semester: form.semester, section: form.section.toUpperCase() },
      });
      if (data.success) setPreview(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoadingPreview(false);
    }
  };

  const allot = async () => {
    if (!form.mentorId || !form.batch || !form.semester || !form.section) {
      return toast.error("Fill faculty, batch, semester and section");
    }
    setAssigning(true);
    try {
      const { data } = await api.patch("/master-data/students/mentor-bulk", {
        ...form,
        section: form.section.toUpperCase(),
        semester: Number(form.semester),
      });
      if (data.success) {
        toast.success(data.message);
        setPreview(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to allot mentor");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <UserCheck size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Assign Mentor for Section</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Bulk-assigns the TG (mentor) — the same mentor field No Dues already uses — to every student in a section.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Faculty (Mentor)
            <select
              value={form.mentorId}
              onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select faculty</option>
              {faculty.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Batch
            <input
              value={form.batch}
              onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
              placeholder="e.g. 2023"
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Semester
            <select
              value={form.semester}
              onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
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
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Section
            <input
              value={form.section}
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value.toUpperCase() }))}
              placeholder="e.g. A"
              maxLength={1}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPreview} disabled={loadingPreview} className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] disabled:opacity-40">
            {loadingPreview ? <Loader2 size={14} className="animate-spin inline" /> : "Preview Students"}
          </button>
          <button onClick={allot} disabled={assigning} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {assigning ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Allot Mentor
          </button>
        </div>
      </div>

      {preview && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
            {preview.length} student(s) will be assigned this mentor
          </div>
          {preview.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)] text-sm">No students match this batch/semester/section yet.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-light)]">
              {preview.map((s) => (
                <div key={s._id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="font-bold text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-[var(--text-secondary)] text-xs">{s.enrollmentNumber}</span>
                  {s.mentor?.name && (
                    <span className="badge ml-auto">Currently: {s.mentor.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
