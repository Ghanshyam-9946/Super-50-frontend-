import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchLeaderboard } from '../../features/students/studentsSlice';
import { Trophy, Medal, Search, Filter, TrendingUp, Calendar, Award, Zap } from 'lucide-react';

const rankColors = { 1: '#fbbf24', 2: '#94a3b8', 3: '#cd7c2f' };
const rankEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
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

  const myRank = leaderboard.findIndex((s) => s._id === user?._id) + 1;

  const departments = [...new Set(leaderboard.map((s) => s.department))].filter(Boolean);

  return (
    <div className="page-layout">
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            <Trophy size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10, color: '#fbbf24' }} />
            Leaderboard
          </h1>
          <p className="page-subtitle">Top performing Super 50 students ranked by performance score</p>
        </motion.div>
      </div>

      {/* My rank banner (students only) */}
      {user?.role === 'student' && myRank > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 14, padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 600, marginBottom: 4 }}>YOUR CURRENT RANK</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>
              #{myRank} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>out of {leaderboard.length} students</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Your Score</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#7c3aed' }}>
              {Math.round(user?.performanceScore || 0)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name or enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="leaderboard-search"
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select className="select-field" style={{ paddingLeft: 36, minWidth: 180 }} value={dept} onChange={(e) => setDept(e.target.value)} id="leaderboard-dept-filter">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Top 3 podium */}
      {!search && filtered.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, alignItems: 'flex-end' }}
        >
          {/* 2nd */}
          <PodiumCard student={filtered[1]} rank={2} height={130} />
          {/* 1st */}
          <PodiumCard student={filtered[0]} rank={1} height={170} />
          {/* 3rd */}
          <PodiumCard student={filtered[2]} rank={3} height={100} />
        </motion.div>
      )}

      {/* Full Table */}
      <motion.div className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 0, overflow: 'hidden' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>All Students ({filtered.length})</span>
        </div>

        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>Attendance</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => {
                  const isMe = student._id === user?._id;
                  const rColor = rankColors[student.rank];
                  return (
                    <motion.tr key={student._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={isMe ? { outline: '2px solid rgba(124,58,237,0.4)' } : {}}>
                      <td style={{ fontWeight: 800, fontSize: 16, color: rColor || 'var(--text-muted)', width: 60 }}>
                        {rankEmojis[student.rank] || `#${student.rank}`}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `hsl(${(student.name.charCodeAt(0) * 37) % 360}, 60%, 30%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0,
                          }}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {student.name} {isMe && <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.2)', color: 'var(--accent-light)', padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>You</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{student.enrollmentNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{student.department}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{student.batch}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, minWidth: 60 }}>
                            <div style={{ height: '100%', width: `${student.attendancePercentage}%`, background: student.attendancePercentage >= 75 ? 'var(--success)' : student.attendancePercentage >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 38 }}>{Math.round(student.attendancePercentage)}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 18, fontWeight: 900,
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
      whileHover={{ y: -4 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'var(--bg-card)', border: `2px solid ${color}33`,
        borderRadius: 16, padding: '16px 20px', width: 160,
        boxShadow: `0 0 20px ${color}22`,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{rankEmojis[rank]}</div>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `hsl(${(student.name.charCodeAt(0) * 37) % 360}, 60%, 30%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 8,
        border: `2px solid ${color}`,
      }}>
        {student.name.charAt(0)}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, textAlign: 'center', marginBottom: 2 }}>{student.name.split(' ')[0]}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{student.department}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{Math.round(student.performanceScore)}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>score</div>
      <div style={{ marginTop: 6, height: height * 0.15, width: '100%', background: `${color}22`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>#{rank}</span>
      </div>
    </motion.div>
  );
}
