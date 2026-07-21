import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { UAParser } from 'ua-parser-js';

const METHOD_COLORS = {
  POST: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  PUT: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  PATCH: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  DELETE: 'bg-red-500/10 border-red-500/20 text-red-500',
};

const fmtDateTime = (d) => {
  const date = new Date(d);
  return isValid(date) ? format(date, 'dd MMM yyyy, hh:mm:ss a') : '—';
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (moduleFilter) params.module = moduleFilter;
      if (methodFilter) params.method = methodFilter;
      if (successFilter) params.success = successFilter;
      const { data } = await api.get('/activity-logs', { params });
      if (data.success) {
        setLogs(data.data);
        setModules(data.modules);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, methodFilter, successFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [moduleFilter, methodFilter, successFilter]);

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      l.description?.toLowerCase().includes(q) ||
      l.userName?.toLowerCase().includes(q) ||
      l.path?.toLowerCase().includes(q) ||
      l.ip?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <History className="text-[var(--primary)]" size={30} /> Activity Logs
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            System-wide audit trail of every create/update/delete action — {total} total entries.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-3xl flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description, user, path, or IP (current page only)…"
            className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-[var(--text-secondary)] shrink-0" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] outline-none"
          >
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] outline-none"
          >
            <option value="">All methods</option>
            <option value="POST">POST (Create)</option>
            <option value="PUT">PUT (Update)</option>
            <option value="PATCH">PATCH (Update)</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select
            value={successFilter}
            onChange={(e) => setSuccessFilter(e.target.value)}
            className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] outline-none"
          >
            <option value="">Success + Failed</option>
            <option value="true">Success only</option>
            <option value="false">Failed only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl">
          <p className="text-[var(--text-primary)] font-bold">No activity logs match your filters.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left">
                  {['When', 'User', 'Module', 'Method', 'Description', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((log) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-[11px] text-[var(--text-secondary)] whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-xs text-[var(--text-primary)]">{log.userName}</div>
                        {log.userRole && <div className="text-[10px] text-[var(--text-secondary)]">{log.userRole}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">{log.module}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${METHOD_COLORS[log.method] || 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[var(--text-primary)] max-w-md truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-5 py-3.5">
                        {log.success ? (
                          <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle2 size={13} /> {log.statusCode}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><XCircle size={13} /> {log.statusCode}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[var(--border-light)]">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
