import { useState } from "react";
import { Gauge, Loader2, Search, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import BatchSelect from "../../../components/BatchSelect";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function LoadCalculation() {
  const [filters, setFilters] = useState({ batch: "", semester: "" });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [downloading, setDownloading] = useState(false);

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

  const download = async (format) => {
    if (!filters.batch || !filters.semester) return toast.error("Enter batch and semester");
    setDownloading(true);
    try {
      const response = await api.get(`/master-data/load-calculation.${format}`, {
        params: filters,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Load-Calculation-${filters.batch}-Sem${filters.semester}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download load calculation");
    } finally {
      setDownloading(false);
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
        <button onClick={load} disabled={loading} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Calculate
        </button>
        <button
          onClick={() => download("xlsx")}
          disabled={downloading}
          className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5 disabled:opacity-40"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Excel
        </button>
        <button
          onClick={() => download("pdf")}
          disabled={downloading}
          className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5 disabled:opacity-40"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
        </button>
      </div>

      {data.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Lecture</th>
                <th className="px-4 py-3">Theory</th>
                <th className="px-4 py-3">Practical</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) =>
                entry.subjects.map((s, i) => (
                  <tr key={`${entry.faculty._id}-${i}`} className="border-b border-[var(--border-light)]">
                    {i === 0 && (
                      <td className="px-4 py-3 align-top" rowSpan={entry.subjects.length}>
                        <div className="font-bold text-[var(--text-primary)]">{entry.faculty.name}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{entry.faculty.email}</div>
                        <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)] mt-1 inline-block">
                          {entry.totalHours} hrs/week
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">{s.subjectName}</td>
                    <td className="px-4 py-3">{s.section}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.role === "Lab Support" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : ""}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.lecture}</td>
                    <td className="px-4 py-3">{s.theory}</td>
                    <td className="px-4 py-3">{s.practical}</td>
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{s.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
