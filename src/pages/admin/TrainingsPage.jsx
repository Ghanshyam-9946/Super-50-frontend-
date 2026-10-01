import { useEffect, useMemo, useRef, useState } from "react";
import {
  GraduationCap, Plus, Loader2, Upload, Award, Users, Download, Trash2, X, Calendar,
  MapPin, CheckCircle2, AlertCircle, FileSpreadsheet, Eye, Rocket, EyeOff, Palette, Search,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }) : "—";
const todayStr = () => new Date().toISOString().slice(0, 10);

// Everything a certificate block can print for a student.
const PLACEHOLDERS = [
  "name", "enrollment", "semester", "semesterRoman", "branch", "training",
  "fromDate", "toDate", "dates", "location", "organizedBy", "attendance", "score",
  "certificateNo", "issuedOn",
];

const emptyForm = () => ({
  name: "", fromDate: todayStr(), toDate: todayStr(), location: "",
  semester: "", batch: "", department: "", organizedBy: "", attendanceThreshold: 75,
});

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";
const labelCls = "flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/trainings");
      setTrainings(data.data || []);
      setCanManage(!!data.canManage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load trainings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/trainings", form);
      toast.success(data.message);
      setForm(emptyForm());
      setCreating(false);
      load();
      setOpenId(data.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not schedule the training");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (training) => {
    if (!window.confirm(`Delete "${training.name}"? Its uploaded attendance, assessment and certificate numbers go too.`)) return;
    try {
      const { data } = await api.delete(`/trainings/${training._id}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Trainings</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Schedule a training, upload its attendance and assessment sheets, design the certificate, then launch it to the students.
            </p>
          </div>
        </div>
        {canManage && (
          <button onClick={() => setCreating((v) => !v)} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5">
            <Plus size={15} /> Schedule training
          </button>
        )}
      </header>

      {creating && (
        <form onSubmit={create} className="glass-card p-6 rounded-3xl space-y-4">
          <h2 className="font-display font-black text-lg text-[var(--text-primary)]">New training</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className={`${labelCls} sm:col-span-2`}>
              Training name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Deep Dive into C" className={`${inputCls} font-normal normal-case tracking-normal`} required />
            </label>
            <label className={labelCls}>
              Location
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lab 204, SISTec GN" className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
            <label className={labelCls}>
              From date
              <input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} className={inputCls} required />
            </label>
            <label className={labelCls}>
              To date
              <input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} className={inputCls} required />
            </label>
            <label className={labelCls}>
              Attendance needed for a certificate
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={form.attendanceThreshold}
                  onChange={(e) => setForm({ ...form, attendanceThreshold: Number(e.target.value) })} className={inputCls} />
                <span className="text-sm text-[var(--text-secondary)]">%</span>
              </div>
            </label>
            <label className={labelCls}>
              Semester
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className={inputCls}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
              </select>
            </label>
            <label className={labelCls}>
              Batch
              <input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="2025" className={inputCls} />
            </label>
            <label className={labelCls}>
              Department
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="CSE" className={inputCls} />
            </label>
            <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
              Organised by (printed on the certificate)
              <input value={form.organizedBy} onChange={(e) => setForm({ ...form, organizedBy: e.target.value })}
                placeholder="the Department of Computer Science & Engineering in collaboration with the CS Allied Branches"
                className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Schedule
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-sm font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)]">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : trainings.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No training scheduled yet.
        </div>
      ) : (
        <div className="space-y-3">
          {trainings.map((t) => (
            <div key={t._id} className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                  {t.name}
                  {t.certificateLaunched
                    ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Certificates launched</span>
                    : <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)]">Not launched</span>}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {fmt(t.fromDate)} → {fmt(t.toDate)}</span>
                  {t.location && <span className="flex items-center gap-1"><MapPin size={12} /> {t.location}</span>}
                  <span className="flex items-center gap-1"><Users size={12} /> {t.students} student{t.students === 1 ? "" : "s"}</span>
                  <span className="flex items-center gap-1"><Award size={12} /> {t.certificates} certificate{t.certificates === 1 ? "" : "s"}</span>
                  <span>min {t.attendanceThreshold}% attendance</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setOpenId(t._id)} className="btn-premium text-xs px-4 py-2">Open</button>
                {canManage && (
                  <button onClick={() => remove(t)} title="Delete" className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {openId && <TrainingDetail id={openId} onClose={() => { setOpenId(null); load(); }} />}
    </div>
  );
}

/* ===================== one training ===================== */

const TABS = [
  { key: "students", label: "Students", icon: Users },
  { key: "certificate", label: "Certificate", icon: Palette },
];

const TrainingDetail = ({ id, onClose }) => {
  const [data, setData] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("students");
  const [busy, setBusy] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const res = await api.get(`/trainings/${id}`);
      setData(res.data.data);
      setRecords(res.data.records || []);
      setSummary(res.data.summary);
      setCanManage(!!res.data.canManage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the training");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const upload = async (kind, file) => {
    if (!file) return;
    setBusy(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/trainings/${id}/${kind}`, fd);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy("");
    }
  };

  const launch = async (on) => {
    setBusy("launch");
    try {
      const res = await api.post(`/trainings/${id}/${on ? "launch" : "unlaunch"}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not launch");
    } finally {
      setBusy("");
    }
  };

  const openPdf = async (path, filename) => {
    try {
      const res = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      if (filename) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      } else {
        window.open(url, "_blank");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      const message = err.response?.data instanceof Blob ? "Could not create the PDF" : err.response?.data?.message;
      toast.error(message || "Could not create the PDF");
    }
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => `${r.studentName} ${r.enrollmentNumber}`.toLowerCase().includes(q));
  }, [records, search]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-card w-full max-w-5xl rounded-3xl p-6 my-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        {loading || !data ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-black text-[var(--text-primary)]">{data.name}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {fmt(data.fromDate)} → {fmt(data.toDate)}{data.location ? ` · ${data.location}` : ""} · certificate needs {data.attendanceThreshold}% attendance
                </p>
              </div>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              {[
                ["Students", summary.students],
                [`Eligible (≥${data.attendanceThreshold}%)`, summary.eligible],
                ["With assessment", summary.withAssessment],
                ["Certificates", summary.certificates],
              ].map(([label, value]) => (
                <div key={label} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-3">
                  <div className="text-xl font-display font-black text-[var(--text-primary)]">{value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
                </div>
              ))}
            </div>

            {canManage && (
              <div className="flex flex-wrap gap-2">
                <label className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
                  {busy === "attendance" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload attendance
                  <input type="file" accept=".xlsx,.xls" className="hidden" disabled={!!busy}
                    onChange={(e) => { upload("attendance", e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                <label className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
                  {busy === "assessment" ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />} Upload assessment
                  <input type="file" accept=".xlsx,.xls" className="hidden" disabled={!!busy}
                    onChange={(e) => { upload("assessment", e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                <button onClick={() => openPdf(`/trainings/${id}/export`, `training-${data.name}.csv`)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
                  <Download size={13} /> Export CSV
                </button>
                {data.certificateLaunched ? (
                  <button onClick={() => launch(false)} disabled={!!busy} className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <EyeOff size={13} /> Hide from students
                  </button>
                ) : (
                  <button onClick={() => launch(true)} disabled={!!busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5">
                    {busy === "launch" ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />} Launch certificates
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-1.5 border-b border-[var(--border-light)]">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 rounded-t-xl border-b-2 ${
                    tab === key ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5" : "border-transparent text-[var(--text-secondary)]"
                  }`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {tab === "students" ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-60" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or enrollment…" className={`${inputCls} pl-9`} />
                </div>
                {records.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">Nothing uploaded yet — start with the attendance sheet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2">Attendance</th>
                          <th className="px-3 py-2">Assessment</th>
                          <th className="px-3 py-2">Certificate</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((r) => (
                          <tr key={r._id} className="border-b border-[var(--border-light)] last:border-0">
                            <td className="px-3 py-2">
                              <div className="font-bold text-[var(--text-primary)]">{r.studentName || "—"}</div>
                              <div className="text-[11px] text-[var(--text-secondary)]">
                                {r.enrollmentNumber}
                                {!r.matched && <span className="ml-1 text-amber-600">· no account</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {typeof r.attendance?.presentPercent === "number" ? (
                                <span className={r.eligible ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                                  {r.attendance.presentPercent}%
                                </span>
                              ) : <span className="text-[var(--text-secondary)]">—</span>}
                              {r.attendance?.presentHours != null && <div className="text-[11px] text-[var(--text-secondary)]">{r.attendance.presentHours} hrs</div>}
                            </td>
                            <td className="px-3 py-2">
                              {r.assessment?.percent != null ? (
                                <>
                                  <div className="font-bold text-[var(--text-primary)]">{r.assessment.percent}%</div>
                                  <div className="text-[11px] text-[var(--text-secondary)]">{r.assessment.obtained}/{r.assessment.max}</div>
                                </>
                              ) : <span className="text-[var(--text-secondary)]">—</span>}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-[var(--text-secondary)]">{r.certificateNo || "—"}</td>
                            <td className="px-3 py-2 text-right">
                              {r.certificateNo && (
                                <button onClick={() => openPdf(`/trainings/${id}/records/${r._id}/certificate`, `${r.studentName}.pdf`)}
                                  className="btn-outline-premium text-[11px] px-2.5 py-1.5 flex items-center gap-1 ml-auto">
                                  <Download size={11} /> PDF
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <CertificateTab training={data} canManage={canManage} onChanged={load} onPreview={() => openPdf(`/trainings/${id}/certificate-preview`)} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ================= certificate design ================= */

const CertificateTab = ({ training, canManage, onChanged, onPreview }) => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(training.certificateTemplate?._id || training.certificateTemplate || "");
  const [design, setDesign] = useState(training.certificateTemplate?.blocks ? training.certificateTemplate : null);
  const [activeBlock, setActiveBlock] = useState(0);
  const [busy, setBusy] = useState("");
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  // A block's `size` is a fraction of the page height, exactly as the PDF
  // uses it — so the preview has to know how tall it is being drawn.
  const [canvasHeight, setCanvasHeight] = useState(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setCanvasHeight(entry.contentRect.height));
    observer.observe(el);
    setCanvasHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [design?._id]);

  const loadTemplates = async () => {
    const { data } = await api.get("/trainings/templates");
    setTemplates(data.data || []);
    const current = (data.data || []).find((t) => t._id === selected);
    if (current) setDesign(current);
  };

  useEffect(() => { loadTemplates(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const attach = async (templateId) => {
    setSelected(templateId);
    setDesign(templates.find((t) => t._id === templateId) || null);
    try {
      await api.put(`/trainings/${training._id}`, { certificateTemplate: templateId || null });
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not attach the design");
    }
  };

  const createDesign = async () => {
    const name = window.prompt("Name this certificate design", `${training.name} certificate`);
    if (!name) return;
    try {
      const { data } = await api.post("/trainings/templates", { name });
      await loadTemplates();
      attach(data.data._id);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the design");
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      const { data } = await api.put(`/trainings/templates/${design._id}`, { blocks: design.blocks, name: design.name });
      setDesign(data.data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the design");
    } finally {
      setBusy("");
    }
  };

  const uploadBackground = async (file) => {
    if (!file) return;
    setBusy("bg");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/trainings/templates/${design._id}/background`, fd);
      setDesign(data.data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy("");
    }
  };

  const setBlock = (idx, patch) =>
    setDesign((d) => ({ ...d, blocks: d.blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b)) }));

  const addBlock = () =>
    setDesign((d) => ({
      ...d,
      blocks: [...d.blocks, { text: "New text {{name}}", x: 0.2, y: 0.5, width: 0.6, align: "center", size: 0.03, color: "#16324f" }],
    }));

  const removeBlock = (idx) =>
    setDesign((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== idx) }));

  // Dragging a block on the preview writes back fractions of the page, so
  // the PDF lands in exactly the same place.
  const onMouseDown = (idx) => (e) => {
    e.preventDefault();
    setActiveBlock(idx);
    dragRef.current = { idx, startX: e.clientX, startY: e.clientY, block: design.blocks[idx] };
  };

  useEffect(() => {
    const move = (e) => {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - drag.startX) / rect.width;
      const dy = (e.clientY - drag.startY) / rect.height;
      setBlock(drag.idx, {
        x: Math.min(1, Math.max(0, drag.block.x + dx)),
        y: Math.min(1, Math.max(0, drag.block.y + dy)),
      });
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  const block = design?.blocks?.[activeBlock];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className={labelCls}>
          Certificate design
          <select value={selected} onChange={(e) => attach(e.target.value)} disabled={!canManage} className={inputCls}>
            <option value="">— none —</option>
            {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </label>
        {canManage && <button onClick={createDesign} className="btn-outline-premium text-xs px-3 py-2.5">New design</button>}
        {design && canManage && (
          <>
            <label className="text-xs font-bold px-3 py-2.5 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
              {busy === "bg" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload background
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadBackground(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <button onClick={save} disabled={busy === "save"} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5">
              {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save design
            </button>
          </>
        )}
        <button onClick={onPreview} disabled={!selected} className="btn-outline-premium text-xs px-3 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
          <Eye size={13} /> Preview PDF
        </button>
      </div>

      {!design ? (
        <div className="bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center text-sm text-[var(--text-secondary)]">
          Pick a design, or create one and upload your certificate artwork as the background.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
          {/* preview canvas — drag the text where you want it */}
          <div
            ref={canvasRef}
            className="relative w-full rounded-xl overflow-hidden border border-[var(--border-light)] bg-white select-none"
            style={{ aspectRatio: `${design.page?.width || 842} / ${design.page?.height || 595}` }}
          >
            {design.background?.url && (
              <img src={getImageUrl(design.background.url)} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
            )}
            {design.blocks.map((b, i) => (
              <div
                key={i}
                onMouseDown={canManage ? onMouseDown(i) : undefined}
                onClick={() => setActiveBlock(i)}
                className={`absolute ${canManage ? "cursor-move" : ""} ${i === activeBlock ? "outline outline-1 outline-[var(--primary)]" : ""}`}
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.width * 100}%`,
                  textAlign: b.align,
                  color: b.color,
                  fontSize: `${(b.size || 0.03) * (canvasHeight || 420)}px`,
                  fontWeight: b.bold ? 800 : 400,
                  fontStyle: b.italic ? "italic" : "normal",
                  textDecoration: b.underline ? "underline" : "none",
                  lineHeight: 1.25,
                }}
              >
                {b.text}
              </div>
            ))}
          </div>

          {/* block editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Text blocks</span>
              {canManage && <button onClick={addBlock} className="text-xs font-bold text-[var(--primary)]">+ Add</button>}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {design.blocks.map((b, i) => (
                <button key={i} onClick={() => setActiveBlock(i)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg truncate border ${
                    i === activeBlock ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--text-primary)]" : "border-[var(--border-light)] text-[var(--text-secondary)]"
                  }`}>
                  {b.text || "(empty)"}
                </button>
              ))}
            </div>

            {block && canManage && (
              <div className="space-y-2.5 border-t border-[var(--border-light)] pt-3">
                <label className={labelCls}>
                  Text
                  <textarea value={block.text} onChange={(e) => setBlock(activeBlock, { text: e.target.value })} rows={2}
                    className={`${inputCls} font-normal normal-case tracking-normal`} />
                </label>
                <div className="flex flex-wrap gap-1">
                  {PLACEHOLDERS.map((p) => (
                    <button key={p} onClick={() => setBlock(activeBlock, { text: `${block.text}{{${p}}}` })}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--primary)]">
                      {p}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className={labelCls}>
                    Size
                    <input type="range" min="0.01" max="0.12" step="0.002" value={block.size}
                      onChange={(e) => setBlock(activeBlock, { size: Number(e.target.value) })} />
                  </label>
                  <label className={labelCls}>
                    Width
                    <input type="range" min="0.1" max="1" step="0.02" value={block.width}
                      onChange={(e) => setBlock(activeBlock, { width: Number(e.target.value) })} />
                  </label>
                  <label className={labelCls}>
                    Align
                    <select value={block.align} onChange={(e) => setBlock(activeBlock, { align: e.target.value })} className={inputCls}>
                      <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                    </select>
                  </label>
                  <label className={labelCls}>
                    Colour
                    <input type="color" value={block.color} onChange={(e) => setBlock(activeBlock, { color: e.target.value })}
                      className="h-9 w-full bg-transparent border border-[var(--border-light)] rounded-xl" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                  {[["bold", "Bold"], ["italic", "Italic"], ["underline", "Underline"]].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={!!block[key]} onChange={(e) => setBlock(activeBlock, { [key]: e.target.checked })} /> {label}
                    </label>
                  ))}
                  <button onClick={() => removeBlock(activeBlock)} className="text-red-500 font-bold ml-auto">Remove</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {training.certificateLaunched && (
        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
          <AlertCircle size={13} /> Certificates are already launched — design changes apply to every download from now on.
        </p>
      )}
    </div>
  );
};
