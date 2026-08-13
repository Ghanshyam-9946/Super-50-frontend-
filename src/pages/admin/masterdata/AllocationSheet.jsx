import { useState } from "react";
import { FileSpreadsheet, Loader2, Download, FileText, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import BatchSelect from "../../../components/BatchSelect";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AllocationSheet() {
  const [filters, setFilters] = useState({ batch: "", semester: "" });
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [rows, setRows] = useState(null);

  const preview = async () => {
    if (!filters.batch || !filters.semester) return toast.error("Enter batch and semester");
    setPreviewing(true);
    try {
      const { data } = await api.get("/master-data/allocation-sheet", { params: filters });
      if (data.success) setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load preview");
    } finally {
      setPreviewing(false);
    }
  };

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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <FileSpreadsheet size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Release Subject Allocation Sheet</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Preview and export the finalized section-wise subject allocation for a batch + semester.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
        <div className="flex gap-2">
          <button
            onClick={preview}
            disabled={previewing}
            className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5 disabled:opacity-40"
          >
            {previewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Preview
          </button>
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

      {rows && (
        rows.length === 0 ? (
          <div className="glass-card p-10 text-center rounded-3xl text-[var(--text-secondary)]">
            No finalized allocation yet for this batch/semester — finalize it from the Choice Filling Matrix first.
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Lab Support</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b border-[var(--border-light)]">
                    <td className="px-4 py-3">{r.section}</td>
                    <td className="px-4 py-3">{r.subjectCode || "-"}</td>
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{r.subjectName}</td>
                    <td className="px-4 py-3">{r.faculty?.name || "Unassigned"}</td>
                    <td className="px-4 py-3">{r.labSupportFaculty?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
