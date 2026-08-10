import { useState } from "react";
import { Gauge, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function LoadCalculation() {
  const [filters, setFilters] = useState({ batch: "", semester: "" });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const load = async () => {
    if (!filters.batch || !filters.semester) return toast.error("Enter batch and semester");
    setLoading(true);
    try {
      const { data: res } = await api.get("/master-data/load-calculation", { params: filters });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <Gauge size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Load Calculation</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Weekly teaching load per faculty, computed from each Subject's lecture/theory/practical hours.
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
        <button onClick={load} disabled={loading} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Calculate
        </button>
      </div>

      {data.length > 0 && (
        <div className="space-y-2">
          {data.map((entry) => (
            <div key={entry.faculty._id} className="glass-card rounded-2xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">{entry.faculty.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{entry.faculty.email}</div>
                </div>
                <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">{entry.totalHours} hrs/week</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.subjects.map((s, i) => (
                  <span key={i} className="badge">
                    {s.subjectName} (Sec {s.section}) — {s.hours}h
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
