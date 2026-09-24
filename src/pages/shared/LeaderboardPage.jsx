import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchLeaderboard } from '../../features/students/studentsSlice';
import { Search, Filter } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function LeaderboardPage({ limit }) {
  const dispatch = useDispatch();
  const { leaderboard, loading } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [batch, setBatch] = useState('');

  useEffect(() => {
    dispatch(fetchLeaderboard({ department: dept || undefined }));
  }, [dispatch, dept]);

  const filtered = leaderboard.filter(
    (s) => {
      const matchSearch = search ? (s.name.toLowerCase().includes(search.toLowerCase()) || s.enrollmentNumber.toLowerCase().includes(search.toLowerCase())) : true;
      const matchBatch = batch ? s.batch === batch : true;
      return matchSearch && matchBatch;
    }
  ).sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

  const displayLimit = typeof limit === 'number' ? limit : 10;
  const displayed = filtered.slice(0, displayLimit);
  const departments = [...new Set(leaderboard.map((s) => s.department))].filter(Boolean);
  const batches = [...new Set(leaderboard.map((s) => s.batch))].filter(Boolean);

  return (
    <div id="leaderboard" className="p-4 md:p-8 max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mt-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black tracking-widest text-blue-600 border border-blue-100 uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          Live Updates
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tight text-[#151b2b] mb-4">
          Ecosystem <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Leaderboard</span>
        </motion.h1>
        
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-500 font-medium text-lg max-w-2xl">
          Top performing Super 50 students ranked by performance score.
        </motion.p>
      </div>

      {/* Main Filters (Hidden if limit is provided to match clean UI of landing page) */}
      <div className={`flex flex-wrap gap-4 mb-6 ${limit ? 'hidden' : ''}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            placeholder="Search by name or enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-10 text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none shadow-sm cursor-pointer min-w-[200px]"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <motion.div 
        className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
      >
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <span className="font-display font-black text-xl text-slate-900">
            Top {displayLimit} Students
          </span>
          <select
            className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm min-w-[140px]"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="animate-pulse bg-slate-50 rounded-xl h-16" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-slate-500 font-medium whitespace-nowrap">
              <thead className="text-[10px] uppercase bg-white text-slate-400 font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-8 py-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((student, i) => {
                  const isMe = student._id === user?._id;
                  const displayRank = i + 1;
                  
                  return (
                    <motion.tr key={student._id}
                      className="hover:bg-slate-50 transition-colors bg-white"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td className="px-8 py-4 w-20">
                        {displayRank === 1 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 border border-amber-200 font-black shadow-sm text-sm">1</div>
                        ) : displayRank === 2 ? (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 font-black shadow-sm text-sm">2</div>
                        ) : displayRank === 3 ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200 font-black shadow-sm text-sm">3</div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                            #{displayRank}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {student.profileImage ? (
                            <img src={student.profileImage} className="w-10 h-10 rounded-full object-cover shadow-sm" alt={student.name} />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#e9d5ff] flex items-center justify-center text-purple-700 font-bold text-sm shadow-sm">
                              {getInitials(student.name)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[14px] text-slate-800">
                              {student.name} {isMe && <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase font-black tracking-widest ml-2">You</span>}
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-0.5">{student.enrollmentNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-500">{student.department}</td>
                      <td className="px-6 py-4 font-bold text-slate-500">{student.batch}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full w-24 overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${student.attendancePercentage}%`, 
                                background: student.attendancePercentage >= 75 ? '#10b981' : student.attendancePercentage >= 50 ? '#f59e0b' : '#ef4444' 
                              }} 
                            />
                          </div>
                          <span className="text-[11px] font-black text-slate-600 w-8">{Math.round(student.attendancePercentage)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-xl font-display font-black text-[#10b981]">
                          {Math.round(student.performanceScore)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {displayed.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 font-medium">
                No students found for this batch.
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
