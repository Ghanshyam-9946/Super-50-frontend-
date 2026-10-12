import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, BarChart3, Download, FileText, BookOpen, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import api from "../../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const KINDS = [
  { key: "theory", label: "Theory", icon: BookOpen, color: "#8b5cf6" },
  { key: "lab", label: "Lab", icon: FlaskConical, color: "#0ea5e9" },
];

const tone = (avg) => (avg >= 4 ? "text-green-600" : avg >= 3 ? "text-amber-600" : "text-red-500");

export default function FeedbackDashboardPage() {
  const { formId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  // Theory and lab are never shown mixed: one tab each.
  const [kind, setKind] = useState("theory");
  const [selectedKey, setSelectedKey] = useState("");
  const [downloading, setDownloading] = useState("");

  // CSV to work with, PDF to file — the same numbers shown here. `scope`
  // is the open tab, or "" for theory and lab together in one file.
  const download = async (format, scope) => {
    setDownloading(`${format}-${scope}`);
    try {
      const res = await api.get(`/feedback/${formId}/report`, {
        params: { format, ...(scope ? { kind: scope } : {}) },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      const name = `${data?.form?.title || "Faculty-Feedback"}${scope ? `-${scope}` : ""}`.replace(/[^A-Za-z0-9]+/g, "-");
      a.href = url;
      a.download = `${name}.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error("Could not build the report");
    } finally {
      setDownloading("");
    }
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/feedback/${formId}/analytics`)
      .then(({ data: res }) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [formId]);

  const meta = KINDS.find((k) => k.key === kind);

  const overall = useMemo(
    () => (data ? data.overall.filter((o) => (o.kind || "theory") === kind).sort((a, b) => b.avgRating - a.avgRating) : []),
    [data, kind]
  );

  const overallChart = useMemo(() => ({
    labels: overall.map((o) => `${o.facultyName} (${o.subjectName})`),
    datasets: [{ label: "Average Rating (out of 5)", data: overall.map((o) => o.avgRating), backgroundColor: meta.color }],
  }), [overall, meta]);

  const questionRows = useMemo(() => {
    if (!data || !selectedKey) return [];
    const [facultyId, subjectName] = selectedKey.split("::");
    const order = (kind === "lab" ? data.form.labQuestions : data.form.questions) || [];
    return data.perQuestion
      .filter((r) => (r.kind || "theory") === kind && r.facultyId === facultyId && r.subjectName === subjectName)
      // In the order the admin wrote them, not the order the database returns.
      .sort((a, b) => order.indexOf(a.question) - order.indexOf(b.question));
  }, [data, selectedKey, kind]);

  const perQuestionChart = useMemo(() => ({
    labels: questionRows.map((r) => r.question),
    datasets: [{ label: "Average Rating (out of 5)", data: questionRows.map((r) => r.avgRating), backgroundColor: "#22c55e" }],
  }), [questionRows]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!data) return null;

  const counts = data.responsesByKind || { theory: 0, lab: 0 };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <Link to="/admin/feedback" className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ArrowLeft size={26} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">{data.form.title}</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            {data.form.batch} · Sem {data.form.semester} · {data.form.sections.join(", ")} · {data.totalResponses} student(s) responded
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={() => download("csv", "")} disabled={!!downloading}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {downloading === "csv-" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Full CSV
          </button>
          <button onClick={() => download("pdf", "")} disabled={!!downloading}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {downloading === "pdf-" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Full PDF
          </button>
        </div>
      </header>

      {/* Theory | Lab */}
      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => { setKind(k.key); setSelectedKey(""); }}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border ${
              kind === k.key
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "glass-card border-[var(--border-light)] text-[var(--text-primary)]"
            }`}
          >
            <k.icon size={15} /> {k.label} Report
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${kind === k.key ? "bg-white/20" : "bg-[var(--border-light)]"}`}>
              {counts[k.key]}
            </span>
          </button>
        ))}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => download("csv", kind)} disabled={!!downloading}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {downloading === `csv-${kind}` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} {meta.label} CSV
          </button>
          <button onClick={() => download("pdf", kind)} disabled={!!downloading}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {downloading === `pdf-${kind}` ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} {meta.label} PDF
          </button>
        </div>
      </div>

      {overall.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No {meta.label.toLowerCase()} feedback collected yet.
        </div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 size={16} /> {meta.label} — Overall Average Rating per Faculty
            </h3>
            <Bar data={overallChart} options={chartOptions} />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-right">Average / 5</th>
                  <th className="px-4 py-3 text-right">Ratings</th>
                </tr>
              </thead>
              <tbody>
                {overall.map((o) => (
                  <tr key={`${o.facultyId}::${o.subjectName}`} className="border-b border-[var(--border-light)]">
                    <td className="px-4 py-2.5 font-bold text-[var(--text-primary)]">{o.facultyName}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">{o.subjectName}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${tone(o.avgRating)}`}>{o.avgRating.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{o.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{meta.label} — Per-Question Breakdown</h3>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm max-w-full"
            >
              <option value="">Select a faculty + subject</option>
              {overall.map((o) => (
                <option key={`${o.facultyId}::${o.subjectName}`} value={`${o.facultyId}::${o.subjectName}`}>
                  {o.facultyName} — {o.subjectName} (avg {o.avgRating})
                </option>
              ))}
            </select>
            {questionRows.length > 0 && (
              <>
                <Bar data={perQuestionChart} options={chartOptions} />
                <table className="w-full text-xs">
                  <tbody>
                    {questionRows.map((r) => (
                      <tr key={r.question} className="border-t border-[var(--border-light)]">
                        <td className="py-2 pr-3 text-[var(--text-primary)]">{r.question}</td>
                        <td className={`py-2 text-right font-bold w-16 ${tone(r.avgRating)}`}>{r.avgRating.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
