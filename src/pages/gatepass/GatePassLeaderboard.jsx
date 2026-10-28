import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Flame,
  Search,
  Users,
  DoorOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  Filter,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmt, semLine } from './gatePassShared';
import { getImageUrl } from '../../utils/imageUrl';

const TIMEFRAMES = [
  { key: 'all', label: 'All Time' },
  { key: 'month', label: 'This Month' },
  { key: 'week', label: 'Last 7 Days' },
  { key: 'today', label: 'Today' },
];

export default function GatePassLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (timeframe && timeframe !== 'all') params.set('timeframe', timeframe);
      if (search.trim()) params.set('search', search.trim());
      if (department && department !== 'all') params.set('department', department);

      const res = await api.get(`/gate-pass/leaderboard?${params.toString()}`);
      setData(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load gate pass leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaderboard();
  };

  // Compute unique departments for filter
  const departments = Array.from(
    new Set(data.map((item) => item.student?.department).filter(Boolean))
  );

  // Overall statistics
  const totalPassesAll = data.reduce((acc, curr) => acc + curr.totalPasses, 0);
  const totalExitedAll = data.reduce((acc, curr) => acc + curr.usedCount, 0);
  const totalApprovedAll = data.reduce((acc, curr) => acc + curr.approvedCount, 0);
  const totalStudents = data.length;

  const top3 = data.slice(0, 3);
  const remaining = data.slice(3);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-purple-500/20 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center font-bold">
            <Trophy size={22} className="text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Total Students</div>
            <div className="text-xl font-display font-black text-[var(--text-primary)]">{totalStudents}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-blue-500/20 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <DoorOpen size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Total Gate Passes</div>
            <div className="text-xl font-display font-black text-[var(--text-primary)]">{totalPassesAll}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-emerald-500/20 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Exited / Cleared</div>
            <div className="text-xl font-display font-black text-[var(--text-primary)]">{totalExitedAll}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5 border border-amber-500/20 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Exit Ratio</div>
            <div className="text-xl font-display font-black text-[var(--text-primary)]">
              {totalPassesAll > 0 ? `${Math.round((totalExitedAll / totalPassesAll) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((entry, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;
            const isSecond = rank === 2;
            const isThird = rank === 3;

            const borderColors = isFirst
              ? 'border-amber-400/60 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent shadow-amber-500/10'
              : isSecond
              ? 'border-slate-300/60 bg-gradient-to-b from-slate-400/15 via-slate-400/5 to-transparent'
              : 'border-amber-700/60 bg-gradient-to-b from-amber-700/15 via-amber-700/5 to-transparent';

            const badgeBg = isFirst
              ? 'bg-amber-500 text-slate-950 shadow-amber-500/40'
              : isSecond
              ? 'bg-slate-300 text-slate-900 shadow-slate-400/30'
              : 'bg-amber-700 text-amber-100 shadow-amber-700/30';

            const trophyEmoji = isFirst ? '🥇' : isSecond ? '🥈' : '🥉';

            return (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-5 rounded-3xl border ${borderColors} relative flex flex-col justify-between shadow-lg overflow-hidden`}
              >
                {/* Crown / Rank Banner */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${badgeBg}`}>
                    <span>{trophyEmoji}</span>
                    <span>Rank #{rank}</span>
                  </span>
                  <div className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    <Flame size={14} /> {entry.totalPasses} {entry.totalPasses === 1 ? 'Pass' : 'Passes'}
                  </div>
                </div>

                <div className="flex items-center gap-3.5 my-2">
                  <div
                    className="w-12 h-12 rounded-2xl border border-[var(--border-light)] shadow-md flex items-center justify-center font-black text-white text-base shrink-0 overflow-hidden"
                    style={{ background: `hsl(${(entry.student.name.charCodeAt(0) * 47) % 360}, 65%, 45%)` }}
                  >
                    {entry.student.profileImage ? (
                      <img
                        src={getImageUrl(entry.student.profileImage)}
                        alt={entry.student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      entry.student.name[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-black text-base text-[var(--text-primary)] truncate">
                      {entry.student.name}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
                      {entry.student.enrollmentNumber || entry.student.enrollmentNo || entry.student.email}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                      {semLine(entry.student)}
                    </div>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="pt-3 mt-3 border-t border-[var(--border-light)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                    <CheckCircle2 size={13} /> {entry.usedCount} Exited
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                    Last: {fmt(entry.lastPassAt)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Controls & Filters Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[var(--border-light)] shadow-sm">
        {/* Timeframe selector tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-input)] rounded-xl border border-[var(--border-light)] w-full md:w-auto overflow-x-auto">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                timeframe === t.key
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search input and department selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 md:max-w-md justify-end">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search student or enrollment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] shadow-sm"
            />
          </form>

          {departments.length > 0 && (
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] shadow-sm cursor-pointer"
            >
              <option value="all">All Depts</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          <button
            onClick={fetchLeaderboard}
            className="p-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)] bg-[var(--bg-input)] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-[var(--border-light)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
            <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
              <tr>
                <th className="px-5 py-4 w-16 text-center">Rank</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Department & Sem</th>
                <th className="px-5 py-4 text-center">Total Passes</th>
                <th className="px-5 py-4 text-center">Exited / Used</th>
                <th className="px-5 py-4">Recent Reason</th>
                <th className="px-5 py-4 text-right">Last Exit Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin text-[var(--primary)] mx-auto mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Leaderboard...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                    <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold uppercase tracking-widest text-xs">No gate pass records found for this timeframe.</p>
                  </td>
                </tr>
              ) : (
                data.map((entry, index) => {
                  const rank = index + 1;
                  const isTopRank = rank <= 3;
                  const rankBg =
                    rank === 1
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : rank === 2
                      ? 'bg-slate-300 text-slate-900 font-black shadow-sm'
                      : rank === 3
                      ? 'bg-amber-700 text-amber-100 font-black shadow-sm'
                      : 'bg-slate-500/10 text-slate-500 font-bold border border-slate-500/20';

                  return (
                    <motion.tr
                      key={entry._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.4) }}
                      className={`hover:bg-[var(--bg-hover)] transition-colors ${
                        rank === 1 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Rank Number */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs ${rankBg}`}>
                          {rank}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl border border-[var(--border-light)] shadow-sm flex items-center justify-center font-black text-white text-xs shrink-0 overflow-hidden"
                            style={{ background: `hsl(${(entry.student.name.charCodeAt(0) * 47) % 360}, 65%, 45%)` }}
                          >
                            {entry.student.profileImage ? (
                              <img
                                src={getImageUrl(entry.student.profileImage)}
                                alt={entry.student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              entry.student.name[0]
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[14px] text-[var(--text-primary)]">
                              {entry.student.name}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                              {entry.student.enrollmentNumber || entry.student.enrollmentNo || entry.student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Sem */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-xs text-[var(--text-primary)]">
                          {entry.student.department || '—'}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                          {entry.student.semester ? `Semester ${entry.student.semester}` : ''}
                          {entry.student.section ? ` · Sec ${entry.student.section}` : ''}
                        </div>
                      </td>

                      {/* Total Passes */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-[var(--primary)] border border-purple-500/30 text-xs font-black">
                          <Flame size={13} className="text-amber-500" />
                          {entry.totalPasses} {entry.totalPasses === 1 ? 'pass' : 'passes'}
                        </span>
                      </td>

                      {/* Exited / Used */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-black">
                          <CheckCircle2 size={13} />
                          {entry.usedCount} exited
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <span className="text-xs text-[var(--text-primary)] line-clamp-1 font-medium" title={entry.recentReason}>
                          {entry.recentReason || '—'}
                        </span>
                      </td>

                      {/* Last Date */}
                      <td className="px-5 py-4 text-right font-mono text-xs text-[var(--text-secondary)]">
                        {fmt(entry.lastPassAt)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
