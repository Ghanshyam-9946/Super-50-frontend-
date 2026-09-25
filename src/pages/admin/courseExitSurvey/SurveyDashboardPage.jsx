import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import api from "../../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SurveyDashboardPage() {
  const { releaseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/course-exit-survey/${releaseId}/analytics`)
      .then(({ data: res }) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [releaseId]);

  const overallChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.overall.map((o) => o.subjectName),
      datasets: [
        {
          label: "Average Rating (out of 5)",
          data: data.overall.map((o) => o.avgRating),
          backgroundColor: "#8b5cf6",
        },
      ],
    };
  }, [data]);

  const selected = useMemo(() => {
    if (!data || !selectedSubjectId) return null;
    return data.overall.find((o) => o.subjectId === selectedSubjectId);
  }, [data, selectedSubjectId]);

  const perQuestionChart = useMemo(() => {
    if (!data || !selectedSubjectId) return null;
    const rows = data.perQuestion.filter((r) => r.subjectId === selectedSubjectId);
    return {
      labels: rows.map((r) => r.question),
      datasets: [
        {
          label: "Average Rating (out of 5)",
          data: rows.map((r) => r.avgRating),
          backgroundColor: "#22c55e",
        },
      ],
    };
  }, [data, selectedSubjectId]);

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

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <Link to="/admin/course-exit-survey" className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <ArrowLeft size={26} />
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            {data.release.title}
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${(data.release.kind || 'theory') === 'lab' ? 'bg-amber-500/15 text-amber-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
              {(data.release.kind || 'theory') === 'lab' ? 'LAB' : 'THEORY'}
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            {data.release.batch} · Sem {data.release.semester} · {data.release.sections.join(", ")} · {data.totalResponses} response(s)
          </p>
        </div>
      </header>

      {data.overall.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">No responses collected yet.</div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 size={16} /> Overall Average Rating per Subject
            </h3>
            <Bar data={overallChart} options={chartOptions} />
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Per-Question Breakdown</h3>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select a subject</option>
              {data.overall.map((o) => (
                <option key={o.subjectId} value={o.subjectId}>
                  {o.subjectName} (avg {o.avgRating})
                </option>
              ))}
            </select>
            {selected && perQuestionChart && <Bar data={perQuestionChart} options={chartOptions} />}
          </div>
        </>
      )}
    </div>
  );
}
