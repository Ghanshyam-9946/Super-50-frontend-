import { useState } from "react";
import { Layers, Search, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Sections() {
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignSemester, setAssignSemester] = useState("");
  const [assignSection, setAssignSection] = useState("");
  const [assigning, setAssigning] = useState(false);

  const search = async () => {
    if (!batch.trim()) return toast.error("Enter a batch to search students");
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/students", { params: { batch: batch.trim() } });
      if (data.success) setStudents(data.data);
      setSelected([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAll = () => setSelected(students.map((s) => s._id));
  const clearSelection = () => setSelected([]);

  const assign = async () => {
    if (selected.length === 0) return toast.error("Select at least one student");
    if (!assignSemester || !assignSection) return toast.error("Choose semester and section");
    setAssigning(true);
    try {
      const { data } = await api.post("/master-data/sections/bulk-assign", {
        studentIds: selected,
        semester: Number(assignSemester),
        section: assignSection,
      });
      if (data.success) {
        toast.success(data.message);
        search();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign section");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <Layers size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Create Section</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Select a batch, pick students, and divide them into a semester + section.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Batch
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g. 2023"
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-40"
            />
          </label>
          <button onClick={search} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Find Students
          </button>
        </div>
      </div>

      {students.length > 0 && (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {selected.length} / {students.length} selected
              </span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]">
                  Select All
                </button>
                <button onClick={clearSelection} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]">
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border-light)]">
              {students.map((s) => (
                <label key={s._id} className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--bg-hover)]">
                  <input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggle(s._id)} />
                  <span className="font-bold text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-[var(--text-secondary)] text-xs">{s.enrollmentNumber}</span>
                  {s.section && (
                    <span className="badge ml-auto">
                      Sem {s.semester} / {s.section}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl flex flex-wrap items-end gap-3 sticky bottom-4 z-10">
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Semester
              <select
                value={assignSemester}
                onChange={(e) => setAssignSemester(e.target.value)}
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
              <select
                value={assignSection}
                onChange={(e) => setAssignSection(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={assign}
              disabled={assigning}
              className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40"
            >
              {assigning ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Assign Section ({selected.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}
