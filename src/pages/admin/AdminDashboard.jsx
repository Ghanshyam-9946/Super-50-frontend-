import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminStats, fetchAllStudents } from '../../features/students/studentsSlice';
import { fetchPendingCertificates } from '../../features/certificates/certificatesSlice';
import { fetchFacultyReviewQueue } from '../../features/resume/resumeSlice';
import { 
  Users, Award, TrendingUp, ClipboardList, 
  ShieldCheck, Clock, FileText, Search, 
  ChevronRight, Filter, Download, Star, UserPlus, Briefcase, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import StudentPlacementHistoryModal from '../../components/StudentPlacementHistoryModal';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, 
  BarElement, Tooltip, Legend, ArcElement 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { adminStats, allStudents, filters } = useSelector((s) => s.students);
  const { pendingCertificates } = useSelector((s) => s.certificates);
  const { facultyResumes } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);

  const [selectedDept, setSelectedDept] = useState('All');
  
  // Placement History Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAllStudents());
    dispatch(fetchPendingCertificates());
    dispatch(fetchFacultyReviewQueue());
  }, [dispatch]);

  const scoreDistribution = useMemo(() => [0, 25, 50, 75].map((threshold, i, arr) => ({
    label: i === 3 ? '75-100' : `${threshold}-${arr[i + 1]}`,
    count: allStudents.filter((s) => 
      (selectedDept === 'All' || s.department === selectedDept) &&
      s.performanceScore >= threshold && s.performanceScore < (arr[i + 1] || 101)
    ).length,
  })), [allStudents, selectedDept]);

  const barData = useMemo(() => ({
    labels: scoreDistribution.map((d) => d.label),
    datasets: [{
      label: 'Students',
      data: scoreDistribution.map((d) => d.count),
      backgroundColor: ['#ef4444', '#f59e0b', '#7c3aed', '#10b981'],
      borderRadius: 12,
    }],
  }), [scoreDistribution]);

  const statCards = useMemo(() => [
    { icon: Users, label: 'Super 50 Students', value: adminStats?.super50Count || 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    { icon: Users, label: 'Regular Students', value: adminStats?.regularCount || 0, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { icon: TrendingUp, label: 'Avg Performance', value: `${Math.round(adminStats?.stats?.avgScore || 0)}`, unit: '/100', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: FileText, label: 'Resumes to Review', value: facultyResumes.length, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  ], [adminStats, facultyResumes]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            {user?.role === 'admin' ? '⚙️ Enterprise' : '👩‍🏫 Faculty'} Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Monitoring {adminStats?.totalStudents || 0} students across {filters.departments?.length || 0} departments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/bulk-create" className="btn-outline-premium py-2 px-4 text-xs flex items-center gap-2">
            <UserPlus size={16} /> Onboard (Excel)
          </Link>
          <Link to="/admin/drive-eligibility" className="btn-outline-premium py-2 px-4 text-xs flex items-center gap-2">
            <Briefcase size={16} /> Eligibility (Excel)
          </Link>
          <Link to="/admin/drive-results" className="btn-outline-premium py-2 px-4 text-xs flex items-center gap-2 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
            <ClipboardList size={16} /> Results (Excel)
          </Link>
          <Link to="/admin/super50-selection" className="btn-premium py-2 px-4 text-xs flex items-center gap-2 shadow-purple-500/40">
            <Star size={16} /> Super 50
          </Link>
        </div>
      </header>

      {/* Student Placement History Search */}
      <div className="relative z-40">
        <div className={`glass-card p-4 flex items-center gap-4 transition-all ${isSearchFocused ? 'ring-2 ring-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : ''}`}>
          <Search className="text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search student by name or enrollment number to view placement history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-sm font-bold"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isSearchFocused && searchQuery.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
            >
              {allStudents
                .filter(s => 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .slice(0, 10)
                .map(student => (
                  <div 
                    key={student._id}
                    onClick={() => {
                      setSelectedStudentForHistory(student);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-4 border-b border-white/5 hover:bg-white/[0.05] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} 
                        className="w-10 h-10 rounded-full border border-white/10"
                      />
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{student.name}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{student.enrollmentNumber || 'N/A'} • {student.department}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl" style={{ background: card.bg, color: card.color }}>
                <card.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Real-time</span>
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {card.value}
                <span className="text-sm font-bold text-gray-600 ml-1">{card.unit}</span>
              </div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Performance Score Distribution</h3>
              <p className="text-xs text-gray-500 mt-1">Total student counts by score range</p>
            </div>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Departments</option>
              {filters.departments?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="h-[300px]">
            <Bar 
              data={barData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold' } } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, beginAtZero: true },
                },
              }} 
            />
          </div>
        </div>

        {/* Top Performers */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-white mb-8">🏆 Top Performers</h3>
          <div className="space-y-6">
            {(adminStats?.topStudents || []).map((student, i) => (
              <div key={student._id} className="flex items-center gap-4 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                  i === 1 ? 'bg-gray-400/20 text-gray-400' : 
                  'bg-orange-500/20 text-orange-500'
                }`}>
                  #{i + 1}
                </div>
                <img 
                  src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} 
                  className="w-10 h-10 rounded-full border-2 border-white/5 group-hover:scale-110 transition-transform" 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-white">{student.name}</div>
                    {student.isSuper50 && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{student.department}</div>
                </div>
                <div className="text-xl font-black text-purple-500">{Math.round(student.performanceScore)}</div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-xs font-black uppercase tracking-widest text-purple-500 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 transition-all">
            View Full Leaderboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resume Review Queue */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Resume Review Queue</h3>
            <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {facultyResumes.length} Pending
            </span>
          </div>
          <div className="space-y-4">
            {facultyResumes.slice(0, 4).map((resume) => (
              <div key={resume._id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <FileText className="text-rose-500" size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{resume.student?.name}</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Awaiting Review</div>
                  </div>
                </div>
                <button className="p-2 text-gray-600 hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
            {facultyResumes.length === 0 && (
              <div className="text-center py-12 text-gray-600 font-bold uppercase tracking-widest text-xs">
                Queue is clear
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications / System Alerts */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-white mb-8">System Alerts</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-orange-500" size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Certificate Verification Needed</div>
                <p className="text-xs text-gray-500 mt-1">There are {pendingCertificates.length} certificates waiting for your approval.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Star className="text-purple-500" size={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Super 50 Selection</div>
                <p className="text-xs text-gray-500 mt-1">Unlock premium features for high-performing students.</p>
                <Link to="/admin/super50-selection" className="inline-block mt-3 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors">
                  Open Portal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Placement History Modal */}
      <StudentPlacementHistoryModal 
        isOpen={!!selectedStudentForHistory}
        onClose={() => setSelectedStudentForHistory(null)}
        student={selectedStudentForHistory}
      />
    </div>
  );
}
