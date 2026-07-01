import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchLeaderboard } from '../../features/students/studentsSlice';
import { Trophy, Medal, Search, Filter, TrendingUp, Calendar, Award, Zap } from 'lucide-react';

const rankColors = { 1: '#fbbf24', 2: '#94a3b8', 3: '#cd7c2f' };
const rankEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage({ limit }) {
  const dispatch = useDispatch();
  const { leaderboard, loading } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');

  useEffect(() => {
    dispatch(fetchLeaderboard({ department: dept || undefined }));
  }, [dispatch, dept]);

  const filtered = search
    ? leaderboard.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
    )
    : leaderboard;

  // When a limit is provided (e.g., on the landing page), show only the first `limit` entries. Otherwise default to top 10.
  const displayLimit = typeof limit === 'number' ? limit : 10;
  const displayed = filtered.slice(0, displayLimit);

  const myRank = leaderboard.findIndex((s) => s._id === user?._id) + 1;

  const departments = [...new Set(leaderboard.map((s) => s.department))].filter(Boolean);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black text-[var(--text-primary)] flex items-center">
            <Trophy size={32} className="inline mr-3 text-amber-500" />
            Ecosystem Leaderboard
          </h1>
          <p className="text-[var(--text-secondary)] font-medium">Top performing Super 50 students ranked by performance score</p>
        </motion.div>
      </div>

      {/* My rank banner (students only) */}
      {user?.role === 'student' && myRank > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 border-2 border-[var(--primary-light)] flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(124, 58, 237, 0.02))',
          }}
        >
          <div>
            <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80 mb-1">YOUR CURRENT RANK</div>
            <div className="text-3xl font-display font-black text-[var(--text-primary)]">
              #{myRank} <span className="text-sm text-[var(--text-secondary)] font-bold ml-2">out of {leaderboard.length} students</span>
            </div>
          </div>
          <div className="text-right border-l border-[var(--border-light)] pl-8">
            <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80 mb-1">Your Score</div>
            <div className="text-4xl font-display font-black text-[var(--primary)]">
              {Math.round(user?.performanceScore || 0)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className={`flex flex-wrap gap-4 mb-6 ${limit ? 'hidden' : ''}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
            placeholder="Search by name or enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="leaderboard-search"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-10 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all appearance-none shadow-sm cursor-pointer min-w-[200px]"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            id="leaderboard-dept-filter"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      {!search && filtered.length >= 3 && !limit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex justify-center gap-4 md:gap-8 mb-12 items-end mt-8"
        >
          {/* 2nd */}
          <PodiumCard student={filtered[1]} rank={2} height={120} />
          {/* 1st */}
          <PodiumCard student={filtered[0]} rank={1} height={160} />
          {/* 3rd */}
          <PodiumCard student={filtered[2]} rank={3} height={90} />
        </motion.div>
      )}

      {/* Full Table */}
      <motion.div className="glass-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="p-6 border-b border-[var(--border-light)] flex justify-between items-center bg-[var(--bg-app)]">
          <span className="font-display font-black text-lg text-[var(--text-primary)]">
            Top {displayLimit} Students
          </span>
        </div>

        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="animate-pulse bg-[var(--bg-hover)] rounded-xl h-14" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
              <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {displayed.map((student, i) => {
                  const isMe = student._id === user?._id;
                  const rColor = rankColors[student.rank];
                  return (
                    <motion.tr key={student._id}
                      className="hover:bg-[var(--bg-hover)] transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={isMe ? { backgroundColor: 'rgba(139, 92, 246, 0.05)', position: 'relative' } : {}}>
                      {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]" />}
                      <td className="px-6 py-4 font-black text-lg" style={{ color: rColor || '#94a3b8', width: 80 }}>
                        {rankEmojis[student.rank] || (
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                            #{student.rank}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={student.profileImage || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
                            className="w-10 h-10 rounded-full border border-[var(--border-light)] shadow-sm object-cover"
                            alt={student.name}
                          />
                          <div>
                            <div className="font-bold text-[14px] text-[var(--text-primary)]">
                              {student.name} {isMe && <span className="text-[9px] bg-purple-500/10 text-[var(--primary)] px-2 py-0.5 rounded uppercase font-black tracking-widest ml-2">You</span>}
                            </div>
                            <div className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80 mt-0.5">{student.enrollmentNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">{student.department}</td>
                      <td className="px-6 py-4 font-bold">{student.batch}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full min-w-[80px] overflow-hidden border border-[var(--border-light)]">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${student.attendancePercentage}%`, 
                                background: student.attendancePercentage >= 75 ? '#10b981' : student.attendancePercentage >= 50 ? '#f59e0b' : '#ef4444' 
                              }} 
                            />
                          </div>
                          <span className="text-[11px] font-black text-[var(--text-primary)] min-w-[32px]">{Math.round(student.attendancePercentage)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-display font-black" style={{
                          color: student.performanceScore >= 75 ? '#10b981' : student.performanceScore >= 50 ? '#7c3aed' : student.performanceScore >= 25 ? '#f59e0b' : '#ef4444',
                        }}>
                          {Math.round(student.performanceScore)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function PodiumCard({ student, rank, height }) {
  const color = rankColors[rank];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-card flex flex-col items-center justify-end relative shadow-md transition-all"
      style={{
        border: `2px solid ${color}33`,
        padding: '24px 20px 0', 
        width: 180,
      }}
    >
      <div className="absolute -top-6 text-4xl drop-shadow-md">{rankEmojis[rank]}</div>
      
      <img
        src={student.profileImage || `https://ui-avatars.com/api/?name=${student.name}&background=random`}
        className="w-16 h-16 rounded-full border-[3px] shadow-sm z-10 bg-[var(--bg-modal)] object-cover"
        style={{ borderColor: color }}
        alt={student.name}
      />
      
      <div className="font-display font-black text-[15px] text-[var(--text-primary)] text-center mt-3 truncate w-full px-2">{student.name.split(' ')[0]}</div>
      <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1 opacity-80 truncate w-full text-center px-2">{student.department}</div>
      
      <div className="mt-4 text-center">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80 mb-0.5">Score</div>
        <div className="text-3xl font-display font-black" style={{ color }}>{Math.round(student.performanceScore)}</div>
      </div>
      
      <div 
        className="mt-6 w-[calc(100%+40px)] rounded-t-xl flex items-center justify-center opacity-80" 
        style={{ height, background: `linear-gradient(to top, ${color}22, ${color}44)` }}
      >
        <span className="text-2xl font-display font-black" style={{ color: color }}>#{rank}</span>
      </div>
    </motion.div>
  );
}
