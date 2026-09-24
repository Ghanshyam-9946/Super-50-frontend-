import { useState, useEffect } from "react";
import { Gauge, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Self-service view of the coordinator-facing Load Calculation feature
// (see admin/masterdata/LoadCalculation.jsx) — no batch/semester picker
// needed since it's always scoped to just the logged-in faculty, across
// every combo they're actually assigned to (GET /load-calculation/mine).
export default function MyLoad() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get("/master-data/load-calculation/mine")
      .then(({ data: res }) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load your teaching load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <Gauge size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">My Teaching Load</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Your weekly teaching load across every batch and semester you're currently assigned to.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : !data ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          You aren't assigned to any subject yet — ask the coordinator to finalize your Choice Filling allocation.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)]">{data.faculty.name}</span>
            <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">{data.totalHours} hrs/week</span>
          </div>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
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
              {data.subjects.map((s, i) => (
                <tr key={i} className="border-b border-[var(--border-light)]">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
