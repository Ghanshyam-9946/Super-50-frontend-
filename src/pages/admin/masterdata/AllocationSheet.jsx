import { useState, useEffect } from "react";
import { FileSpreadsheet, Loader2, Download, FileText, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AllocationSheet() {
  const [batchOptions, setBatchOptions] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [rows, setRows] = useState(null);

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

  const preview = async () => {
    if (selectedBatches.length === 0 || selectedSemesters.length === 0) {
      return toast.error("Pick at least one batch and one semester");
    }
    setPreviewing(true);
    try {
      const { data } = await api.get("/master-data/allocation-sheet", { params: params() });
      if (data.success) setRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load preview");
    } finally {
      setPreviewing(false);
    }
  };

  const download = async (format) => {
    if (selectedBatches.length === 0 || selectedSemesters.length === 0) {
      return toast.error("Pick at least one batch and one semester");
    }
    setDownloading(true);
    try {
      const response = await api.get(`/master-data/allocation-sheet.${format}`, {
        params: params(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Subject-Allocation-${selectedBatches.join("_")}-Sem${selectedSemesters.join("_")}.${format}`;
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
            Preview and export the finalized section-wise subject allocation. Pick multiple batches/semesters to see the whole allocation sheet in one go.
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
            No finalized allocation yet for this selection — finalize it from the Choice Filling Matrix first.
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Sem</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Support 1</th>
                  <th className="px-4 py-3">Support 2</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b border-[var(--border-light)]">
                    <td className="px-4 py-3">{r.batch}</td>
                    <td className="px-4 py-3">{r.semester}</td>
                    <td className="px-4 py-3">{r.section}</td>
                    <td className="px-4 py-3">{r.subjectCode || "-"}</td>
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{r.subjectName}</td>
                    <td className="px-4 py-3">{r.faculty?.name || "Unassigned"}</td>
                    <td className="px-4 py-3">{r.support1Faculty?.name || "-"}</td>
                    <td className="px-4 py-3">{r.support2Faculty?.name || "-"}</td>
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
