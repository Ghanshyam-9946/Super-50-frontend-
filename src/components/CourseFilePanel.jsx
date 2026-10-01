import { useEffect, useState } from "react";
import {
  FolderOpen, Loader2, Upload, Download, Trash2, FileText, CheckCircle2, FlaskConical, BookOpen, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { getImageUrl } from "../utils/imageUrl";

// The course file for one subject, as the faculty who teaches it sees it:
// the admin's index down the page, one PDF per heading, and a button that
// merges the lot into the complete course file.
const KIND_META = {
  theory: { label: "Theory Course File", icon: BookOpen },
  lab: { label: "Lab Course File", icon: FlaskConical },
};

export default function CourseFilePanel({ subjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      const res = await api.get(`/course-file/subject/${subjectId}`);
      setData(res.data.data || {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the course file");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [subjectId]);

  const upload = async (kind, itemId, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");
    setBusy(itemId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/course-file/subject/${subjectId}/${kind}/${itemId}`, fd);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy("");
    }
  };

  const remove = async (kind, itemId, title) => {
    if (!window.confirm(`Remove the file under "${title}"?`)) return;
    setBusy(itemId);
    try {
      const res = await api.delete(`/course-file/subject/${subjectId}/${kind}/${itemId}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove the file");
    } finally {
      setBusy("");
    }
  };

  const download = async (kind) => {
    setBusy(`download-${kind}`);
    try {
      const res = await api.get(`/course-file/subject/${subjectId}/${kind}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `course-file-${kind}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      let message = "Could not build the course file";
      try {
        if (err.response?.data instanceof Blob) message = JSON.parse(await err.response.data.text()).message || message;
        else message = err.response?.data?.message || message;
      } catch { /* keep the default */ }
      toast.error(message);
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
  }

  const kinds = Object.keys(data || {});
  if (kinds.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-2xl p-6 text-center">
        The admin has not released a course file index yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {kinds.map((kind) => {
        const section = data[kind];
        const { label, icon: Icon } = KIND_META[kind];
        const pct = section.total ? Math.round((section.done / section.total) * 100) : 0;
        return (
          <div key={kind} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-display font-black text-[var(--text-primary)] flex items-center gap-2">
                  <Icon size={15} className="text-[var(--primary)]" /> {label}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {section.done} of {section.total} uploaded
                  {section.requiredTotal > 0 && ` · ${section.requiredDone}/${section.requiredTotal} required`}
                </p>
              </div>
              <button onClick={() => download(kind)} disabled={busy === `download-${kind}` || section.done === 0}
                className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
                {busy === `download-${kind}` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download complete file
              </button>
            </div>

            <div className="h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
              <div className={`h-full ${pct === 100 ? "bg-emerald-500" : "bg-[var(--primary)]"}`} style={{ width: `${pct}%` }} />
            </div>

            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <div key={item._id} className="flex flex-wrap items-center gap-3 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl px-4 py-3">
                  <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                    item.file ? "bg-emerald-500/10 text-emerald-600" : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
                  }`}>
                    {item.file ? <CheckCircle2 size={14} /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {item.title}
                      {item.required === false && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">optional</span>}
                    </div>
                    {item.description && <div className="text-[11px] text-[var(--text-secondary)]">{item.description}</div>}
                    {item.file && (
                      <a href={getImageUrl(item.file.url)} target="_blank" rel="noreferrer"
                        className="text-[11px] font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 mt-0.5">
                        <FileText size={11} /> {item.file.fileName}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
                      {busy === item._id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {item.file ? "Replace" : "Upload PDF"}
                      <input type="file" accept="application/pdf" className="hidden" disabled={!!busy}
                        onChange={(e) => { upload(kind, item._id, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    {item.file && (
                      <button onClick={() => remove(kind, item._id, item.title)} disabled={!!busy}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-40" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {section.requiredDone < section.requiredTotal && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                <AlertCircle size={12} /> {section.requiredTotal - section.requiredDone} required heading(s) still missing — they are skipped in the merged file.
              </p>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
        <FolderOpen size={12} /> The complete file is merged in the order the admin set, with a divider page before each heading.
      </p>
    </div>
  );
}
