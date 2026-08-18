import { useState, useEffect } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const STATUS_BADGE = {
  pending: "bg-amber-500/10 text-amber-500",
  approved: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
};

function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_BADGE[status] || ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ClassEngagementReportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const { data } = await api.get("/class-engagements", { params });
      if (data.success) setRequests(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.from, filters.to]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <UserCheck size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Class Engagement Report</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Every class-cover request across faculty, with its approval status.</p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Status
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          From
          <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          To
          <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-[var(--primary)]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No class engagement requests found.</div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Engaged By</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Responded At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id} className="border-b border-[var(--border-light)] align-top">
                  <td className="px-4 py-3">
                    {new Date(r.date).toLocaleDateString()}
                    <div className="text-xs text-[var(--text-secondary)]">{r.fromTime} - {r.toTime}</div>
                  </td>
                  <td className="px-4 py-3">{r.requestedBy?.name}</td>
                  <td className="px-4 py-3">{r.engagedBy?.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{r.reason}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {r.status === "rejected" && r.responseNote && (
                      <div className="text-xs text-[var(--text-secondary)] mt-1">{r.responseNote}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {r.respondedAt ? new Date(r.respondedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
