import { useState, useEffect } from "react";
import { Gauge, Loader2, Search, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function LoadCalculation() {
  const [batchOptions, setBatchOptions] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get("/master-data/batches")
      .then(({ data: res }) => {
        if (res.success) setBatchOptions(res.data);
      })
      .catch(() => {});
  }, []);

  const toggleBatch = (b) =>
    setSelectedBatches((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  const toggleSemester = (s) =>
    setSelectedSemesters((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const params = () => ({ batches: selectedBatches.join(","), semesters: selectedSemesters.join(",") });

  const load = async () => {
    if (selectedBatches.length === 0 || selectedSemesters.length === 0) {
      return toast.error("Pick at least one batch and one semester");
    }
    setLoading(true);
    try {
      const { data: res } = await api.get("/master-data/load-calculation", { params: params() });
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const download = async (format) => {
    if (selectedBatches.length === 0 || selectedSemesters.length === 0) {
      return toast.error("Pick at least one batch and one semester");
    }
    setDownloading(true);
    try {
      const response = await api.get(`/master-data/load-calculation.${format}`, {
        params: params(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Load-Calculation-${selectedBatches.join("_")}-Sem${selectedSemesters.join("_")}.${format}`;
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
            Weekly teaching load per faculty, computed from each Subject's lecture/theory/practical hours. Pick multiple batches/semesters to see a faculty's complete load in one view.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Batches</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {batchOptions.map((b) => (
                <label
                  key={b.value}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                    selectedBatches.includes(b.value)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border-light)] text-[var(--text-primary)]"
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={selectedBatches.includes(b.value)} onChange={() => toggleBatch(b.value)} />
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
                    selectedSemesters.includes(s)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border-light)] text-[var(--text-primary)]"
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={selectedSemesters.includes(s)} onChange={() => toggleSemester(s)} />
                  Sem {s}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
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
      </div>

      {data.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Sem</th>
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
                    <td className="px-4 py-3">{s.batch}</td>
                    <td className="px-4 py-3">{s.semester}</td>
                    <td className="px-4 py-3">{s.subjectName}</td>
                    <td className="px-4 py-3">{s.section}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.role !== "Primary" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : ""}`}>
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
