import { useState } from "react";
import { FileSpreadsheet, Loader2, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AllocationSheet() {
  const [filters, setFilters] = useState({ batch: "", semester: "" });
  const [downloading, setDownloading] = useState(false);

  const download = async (format) => {
    if (!filters.batch || !filters.semester) return toast.error("Enter batch and semester");
    setDownloading(true);
    try {
      const response = await api.get(`/master-data/allocation-sheet.${format}`, {
        params: filters,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Subject-Allocation-${filters.batch}-Sem${filters.semester}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download allocation sheet");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <FileSpreadsheet size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Release Subject Allocation Sheet</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Export the finalized section-wise subject allocation for a batch + semester.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => download("xlsx")}
            disabled={downloading}
            className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
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
    </div>
  );
}
