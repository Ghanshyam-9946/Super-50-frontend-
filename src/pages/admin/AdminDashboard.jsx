import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminStats, fetchAllStudents, fetchLeaderboard } from '../../features/students/studentsSlice';
import { fetchPendingCertificates, verifyCertificate } from '../../features/certificates/certificatesSlice';
import { fetchPendingActivities, verifyActivity } from '../../features/activities/activitiesSlice';
import {
  Users, Award, TrendingUp, ClipboardList,
  ShieldCheck, Clock, FileText, Search,
  ChevronRight, Filter, Download, Star, UserPlus, Briefcase, X, Check, Loader2, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import StudentProfileModal from '../../components/StudentProfileModal';
import api from '../../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { adminStats, allStudents, filters, leaderboard } = useSelector((s) => s.students);
  const { pendingCertificates } = useSelector((s) => s.certificates);
  const { pendingActivities } = useSelector((s) => s.activities);
  const { user } = useSelector((s) => s.auth);

  const [selectedDept, setSelectedDept] = useState('All');
  const [processing, setProcessing] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [activityDetailsModal, setActivityDetailsModal] = useState(null);

  // Placement History Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  // Student Full Record Panel State
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleSelectStudent = async (student) => {
    setLoadingDetails(true);
    setSelectedStudentDetails(null);
    try {
      const { data } = await api.get(`/students/${student._id}`);
      if (data.success) {
        setSelectedStudentDetails(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load student details");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAllStudents());
    dispatch(fetchPendingCertificates());
    dispatch(fetchPendingActivities());
    dispatch(fetchLeaderboard());
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
      backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981'],
      borderRadius: 12,
    }],
  }), [scoreDistribution]);

  const statCards = useMemo(() => [
    { icon: Users, label: 'Super 50 Students', value: adminStats?.super50Count || 0, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { icon: Users, label: 'Regular Students', value: adminStats?.regularCount || 0, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    { icon: TrendingUp, label: 'Avg Performance', value: `${Math.round(adminStats?.stats?.avgScore || 0)}`, unit: '/100', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  ], [adminStats]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            {user?.role === 'admin' ? '⚙️ Enterprise' : user?.role === 'super50_admin' ? '🌟 Super50 Admin' : '👩‍🏫 Faculty'} Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">Monitoring {adminStats?.totalStudents || 0} students across {filters.departments?.length || 0} departments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/bulk-create" className="btn-premium flex items-center gap-2 text-xs">
                <UserPlus size={16} /> Onboard (Excel)
              </Link>
              <Link to="/admin/drive-eligibility" className="btn-premium flex items-center gap-2 text-xs">
                <Briefcase size={16} /> Eligibility (Excel)
              </Link>
              <Link to="/admin/drive-results" className="btn-outline-premium flex items-center gap-2 text-xs">
                <ClipboardList size={16} /> Results (Excel)
              </Link>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'super50_admin') && (
            <Link to="/admin/super50-selection" className="btn-premium flex items-center gap-2 text-xs">
              <Star size={16} /> Super 50
            </Link>
          )}
          {user?.role === 'teacher' && (
            <Link to="/teacher/students" className="btn-premium flex items-center gap-2 text-xs">
              <Users size={16} /> View Student Records
            </Link>
          )}
        </div>
      </header>

      {/* Student Placement History Search */}
      <div className="relative z-40">
        <div className={`bg-[var(--bg-select)] border border-[var(--border-light)] rounded-[1.2rem] p-4 flex items-center gap-4 transition-all duration-300 shadow-sm ${isSearchFocused ? 'ring-4 ring-purple-500/20 shadow-md border-[var(--primary)]' : ''}`}>
          <Search className="text-[var(--primary)]" size={20} />
          <input
            type="text"
            placeholder="Search student by name or enrollment number to view full profile & placements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-slate-400 text-sm font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-hover)] p-1 rounded-md">
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
              className="absolute top-full left-0 right-0 mt-3 bg-[var(--bg-modal)]/95 backdrop-blur-xl border border-[var(--border-light)] rounded-[1.2rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
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
                      handleSelectStudent(student);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-4 border-b border-[var(--border-light)] hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                        className="w-10 h-10 rounded-full border border-[var(--border-light)]"
                        alt={student.name}
                      />
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{student.name}</div>
                        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{student.enrollmentNumber || 'N/A'} • {student.department}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--primary)] transition-all group-hover:translate-x-1" />
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Student Detailed Record Panel */}
      {loadingDetails && (
        <div className="glass-card p-16 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
          <p className="text-[var(--text-secondary)] font-medium text-sm">Fetching student profile and records...</p>
        </div>
      )}

      {!loadingDetails && !selectedStudentDetails && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4 border-dashed">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-sm">
            <Search size={28} />
          </div>
          <h3 className="text-lg font-display font-black text-[var(--text-primary)]">Student Record Lookup</h3>
          <p className="text-[13px] text-[var(--text-secondary)] font-medium max-w-md leading-relaxed">
            Search a student by name above or click on any student in the <strong>Ecosystem Leaderboard</strong> to view their detailed profile, placement drives record, and PMS academic projects.
          </p>
        </div>
      )}

      {selectedStudentDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 relative space-y-8 border-[var(--primary-light)] border-[2px] shadow-sm"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedStudentDetails(null)}
            className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header / Student Profile */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-3xl font-display font-black text-white shadow-md shadow-purple-500/20">
                {selectedStudentDetails.student.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-display font-black text-[var(--text-primary)] flex items-center gap-3">
                  {selectedStudentDetails.student.name}
                  {selectedStudentDetails.student.isSuper50 && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Star size={12} className="fill-amber-500" /> Super 50
                    </span>
                  )}
                </h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1.5 font-medium">
                  {selectedStudentDetails.student.enrollmentNumber} • {selectedStudentDetails.student.department} • Batch {selectedStudentDetails.student.batch}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-8 bg-[var(--bg-app)] p-5 rounded-[1.2rem] border border-[var(--border-light)] shadow-inner-sm">
              <div className="text-center">
                <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80">Attendance</div>
                <div className="text-2xl font-display font-black text-[var(--text-primary)] mt-1">{Math.round(selectedStudentDetails.student.attendancePercentage || 0)}%</div>
              </div>
              <div className="text-center border-l border-[var(--border-light)] pl-8">
                <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80">Performance</div>
                <div className="text-2xl font-display font-black text-[var(--primary)] mt-1">{Math.round(selectedStudentDetails.student.performanceScore || 0)}<span className="text-sm text-slate-400">/100</span></div>
              </div>
              <div className="text-center border-l border-[var(--border-light)] pl-8">
                <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80">Super 50 Status</div>
                {selectedStudentDetails.student.isSuper50 ? (
                  <div className="text-xl font-display font-black text-amber-500 mt-2 flex items-center gap-1 justify-center">
                    <Star size={18} className="fill-amber-500 inline animate-pulse" /> Rank #{leaderboard.findIndex(s => s._id === selectedStudentDetails.student._id) + 1 || 'N/A'}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-400 mt-2.5">Not in Super 50</div>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placement Details */}
            <div className="space-y-5">
              <h3 className="text-lg font-display font-black text-[var(--text-primary)] flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-[var(--primary)] border border-purple-500/20">
                  <Briefcase size={18} />
                </div>
                Placement History
              </h3>

              {/* Placement Stats Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] text-center">
                  <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80">Drives Appeared</div>
                  <div className="text-2xl font-display font-black text-[var(--text-primary)] mt-1">
                    {selectedStudentDetails.placementApplications?.length || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80">Drives Qualified</div>
                  <div className="text-2xl font-display font-black text-emerald-500 mt-1">
                    {selectedStudentDetails.placementApplications?.filter(app => app.status === 'selected' || app.status === 'placed').length || 0}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-app)] border border-[var(--border-light)] rounded-[1.2rem] p-4 space-y-4 max-h-60 overflow-y-auto custom-scrollbar shadow-inner-sm">
                {selectedStudentDetails.placementApplications?.length > 0 ? (
                  selectedStudentDetails.placementApplications.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl shadow-sm">
                      <div>
                        <div className="font-bold text-[14px] text-[var(--text-primary)]">{app.drive?.companyName}</div>
                        <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{app.drive?.package || 'N/A'} package</div>
                      </div>
                      <div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] ${app.status === 'selected' || app.status === 'placed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            app.status === 'eligible' || app.status === 'applied' ? 'bg-purple-500/10 text-[var(--primary)] border border-purple-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 font-medium py-4 text-center">This student hasn't appeared or qualified in any drives yet.</p>
                )}
              </div>
            </div>

            {/* PMS Details */}
            <div className="space-y-5">
              <h3 className="text-lg font-display font-black text-[var(--text-primary)] flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <FileText size={18} />
                </div>
                Academic Project (PMS)
              </h3>
              <div className="bg-[var(--bg-app)] border border-[var(--border-light)] rounded-[1.2rem] p-6 shadow-inner-sm">
                {selectedStudentDetails.team ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-[var(--border-light)]">
                      <div>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80 block">Group Number</span>
                        <span className="font-display font-black text-[var(--text-primary)] text-xl mt-0.5">{selectedStudentDetails.team.groupNo}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80 block">Guide</span>
                        <span className="font-bold text-[var(--text-primary)] text-sm">{selectedStudentDetails.team.guide?.name || 'Assigned soon'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80 block mb-1">Project Title</span>
                      <span className="font-bold text-[var(--primary)] text-[15px] leading-snug">{selectedStudentDetails.team.projectTitle}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80 block mb-2">Team Members</span>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-purple-500/10 text-[var(--primary)] border border-purple-500/20 rounded-md text-[11px] font-bold">
                          {selectedStudentDetails.team.teamLeader?.name} (Leader)
                        </span>
                        {selectedStudentDetails.team.members?.map((m, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-[var(--bg-select)] border border-[var(--border-light)] shadow-sm rounded-md text-[11px] font-bold text-[var(--text-secondary)]">
                            {m.student?.name} ({m.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-[13px] font-medium">This student is not part of any PMS project group yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3.5 rounded-[1rem] ${card.bg} ${card.color} border border-[var(--border-light)]`}>
                <card.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Real-time</span>
            </div>
            <div>
              <div className="text-4xl font-display font-black text-[var(--text-primary)]">
                {card.value}
                <span className="text-sm font-bold text-slate-400 ml-1">{card.unit}</span>
              </div>
              <div className="text-[12px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] mt-2 opacity-80">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {user?.role === 'teacher' ? (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">🎓 Student & Placement Directory</h3>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">Search or browse students to view their full profile, activities, and detailed placement tracking.</p>
            </div>
            <Link to="/teacher/students" className="btn-premium text-xs px-6 py-3 flex items-center gap-2">
              <Users size={16} /> View Complete List
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allStudents.slice(0, 8).map((student) => (
              <div key={student._id} className="bg-[var(--bg-app)] border border-[var(--border-light)] rounded-[1.2rem] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group hover:border-[var(--primary)]">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                    className="w-12 h-12 rounded-full border-2 border-[var(--bg-card)] shadow-sm ring-1 ring-[var(--border-light)]"
                    alt={student.name}
                  />
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text-primary)] flex items-center gap-2">
                      {student.name}
                      {student.isSuper50 && <span className="bg-amber-500/10 text-amber-500 text-[9px] px-2 py-0.5 rounded border border-amber-500/20 uppercase font-black tracking-widest">Super 50</span>}
                    </div>
                    <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1 opacity-80">
                      {student.enrollmentNumber} • {student.department}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentForHistory(student)}
                  className="btn-outline-premium text-xs py-2 px-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye size={14} /> Profile
                </button>
              </div>
            ))}
          </div>
          {allStudents.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-bold text-sm uppercase tracking-widest border border-dashed rounded-3xl mt-6">
              No students found in directory
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Chart */}
            <div className="lg:col-span-2 glass-card p-8 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Performance Distribution</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">Total student counts by score range</p>
                </div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer shadow-sm"
                >
                  <option value="All">All Departments</option>
                  {filters.departments?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex-1 min-h-[300px]">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold', size: 11, family: 'Inter' } } },
                      y: { grid: { color: '#f1f5f9', borderDash: [4, 4] }, border: { display: false }, ticks: { color: '#64748b', font: { weight: '600', size: 11, family: 'Inter' } }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            {/* Top Performers */}
            <div className="glass-card p-8 flex flex-col max-h-[500px]">
              <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
                🏆 Ecosystem Leaderboard
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {(leaderboard || []).slice(0, 15).map((student, i) => (
                  <div
                    key={student._id}
                    onClick={() => handleSelectStudent(student)}
                    className="flex items-center gap-4 group cursor-pointer bg-[var(--bg-select)] border border-[var(--border-light)] hover:border-purple-500/30 hover:shadow-sm p-3 rounded-[1rem] transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] border ${i === 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm' :
                        i === 1 ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-light)] shadow-sm' :
                          i === 2 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-sm' :
                            'bg-[var(--bg-input)] text-[var(--text-secondary)] border-transparent'
                      }`}>
                      #{i + 1}
                    </div>
                    <img
                      src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                      className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] shadow-sm ring-1 ring-[var(--border-light)] group-hover:scale-110 transition-transform"
                      alt={student.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">{student.name}</div>
                        {student.isSuper50 && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] truncate opacity-80">{student.department}</div>
                    </div>
                    <div className="text-lg font-display font-black text-[var(--primary)] shrink-0">{Math.round(student.performanceScore)}</div>
                  </div>
                ))}
              </div>
              <Link to="/leaderboard" className="w-full inline-block text-center mt-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--primary)] border border-[var(--primary)]/20 rounded-xl hover:bg-[var(--bg-hover)] transition-all">
                View Full Leaderboard
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Recent Notifications / System Alerts */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-8">System Alerts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4 items-start p-6 rounded-[1.2rem] bg-orange-500/10 border border-orange-500/20 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-[1rem] bg-[var(--bg-card)] border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500 shadow-sm">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text-primary)]">Certificate Verification</div>
                    <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">There are {pendingCertificates.length} certificates and {pendingActivities?.length || 0} activities waiting for approval.</p>
                    <Link to="/admin/verify" className="inline-flex items-center gap-1 mt-3 text-xs font-black uppercase tracking-widest text-orange-500 transition-colors bg-[var(--bg-select)] px-3 py-1.5 rounded-lg border border-orange-500/20">
                      Verify Now <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-6 rounded-[1.2rem] bg-purple-500/10 border border-purple-500/20 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-[1rem] bg-[var(--bg-card)] border border-purple-500/20 flex items-center justify-center shrink-0 text-[var(--primary)] shadow-sm">
                    <Star size={24} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text-primary)]">Super 50 Selection</div>
                    <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">Unlock premium features for high-performing students.</p>
                    <Link to="/admin/super50-selection" className="inline-flex items-center gap-1 mt-3 text-xs font-black uppercase tracking-widest text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors bg-[var(--bg-select)] px-3 py-1.5 rounded-lg border border-purple-500/20">
                      Open Portal <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pending Certificates Approval for Dashboard */}
              {pendingCertificates.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-6">Pending Certificates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingCertificates.slice(0, 4).map((cert) => (
                      <div key={cert._id} className="bg-[var(--bg-select)] border border-[var(--border-light)] shadow-sm hover:border-[var(--primary)] transition-all rounded-[1.2rem] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14px] text-[var(--text-primary)] truncate">{cert.title}</div>
                          <div className="text-[12px] text-[var(--text-secondary)] font-medium mt-0.5 truncate">By {cert.student?.name} • {cert.issuedBy}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            className="btn-success flex items-center gap-1.5 py-2 px-3 text-[11px] rounded-lg font-black uppercase tracking-wider"
                            onClick={async () => {
                              setProcessing((p) => ({ ...p, [cert._id]: 'approve' }));
                              const result = await dispatch(verifyCertificate({ id: cert._id, action: 'approve' }));
                              setProcessing((p) => ({ ...p, [cert._id]: null }));
                              if (!result.error) toast.success('Certificate approved!');
                              else toast.error(result.payload);
                            }}
                            disabled={!!processing[cert._id]}
                          >
                            {processing[cert._id] === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Approve
                          </button>
                          <button
                            className="btn-danger flex items-center gap-1.5 py-2 px-3 text-[11px] rounded-lg font-black uppercase tracking-wider"
                            onClick={() => setRejectModal(cert)}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingCertificates.length > 4 && (
                    <Link to="/admin/verify" className="inline-block mt-4 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:text-[var(--primary-dark)]">
                      View all {pendingCertificates.length} certificates →
                    </Link>
                  )}
                </div>
              )}

              {/* Pending Activities Approval for Dashboard */}
              {pendingActivities?.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-6">Pending Activities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingActivities.slice(0, 4).map((act) => (
                      <div key={act._id} className="bg-[var(--bg-select)] border border-[var(--border-light)] shadow-sm hover:border-blue-300 transition-all rounded-[1.2rem] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14px] text-[var(--text-primary)] truncate">{act.title}</div>
                          <div className="text-[12px] text-[var(--text-secondary)] font-medium mt-0.5 truncate">By {act.student?.name} • {act.type}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            className="bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--bg-hover)] flex items-center gap-1.5 py-2 px-3 text-[11px] rounded-lg font-black uppercase tracking-wider transition-colors"
                            onClick={() => setActivityDetailsModal(act)}
                          >
                            <Eye size={14} /> Details
                          </button>
                          <button
                            className="btn-success flex items-center gap-1.5 py-2 px-3 text-[11px] rounded-lg font-black uppercase tracking-wider"
                            onClick={async () => {
                              setProcessing((p) => ({ ...p, [act._id]: 'approve' }));
                              const result = await dispatch(verifyActivity({ id: act._id, action: 'approve' }));
                              setProcessing((p) => ({ ...p, [act._id]: null }));
                              if (!result.error) toast.success('Activity approved!');
                              else toast.error(result.payload);
                            }}
                            disabled={!!processing[act._id]}
                          >
                            {processing[act._id] === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Approve
                          </button>
                          <button
                            className="btn-danger flex items-center gap-1.5 py-2 px-3 text-[11px] rounded-lg font-black uppercase tracking-wider"
                            onClick={() => setRejectModal({ ...act, isActivity: true })}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Directory Preview for Dashboard */}
              {user?.role !== 'teacher' && (
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Student Directory Preview</h3>
                    <Link to="/teacher/students" className="text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                      View All {allStudents.length} Students →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allStudents.slice(0, 6).map((student) => (
                      <div key={student._id} className="bg-[var(--bg-app)] border border-[var(--border-light)] rounded-[1.2rem] p-4 flex items-center justify-between group hover:border-[var(--primary)] transition-all cursor-pointer" onClick={() => setSelectedStudentForHistory(student)}>
                        <div className="flex items-center gap-4">
                          <img
                            src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                            className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] shadow-sm ring-1 ring-[var(--border-light)]"
                            alt={student.name}
                          />
                          <div>
                            <div className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-2">
                              <span className="truncate max-w-[120px]">{student.name}</span>
                              {student.isSuper50 && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] mt-0.5 opacity-80">{student.enrollmentNumber}</div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center border border-[var(--border-light)] group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)] group-hover:text-white transition-all duration-300">
                          <Eye size={14} className="text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    ))}
                    {allStudents.length === 0 && (
                      <div className="col-span-full text-center py-8 text-slate-400 font-bold text-[11px] uppercase tracking-widest border border-dashed rounded-2xl">
                        No students found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Student Profile Modal (Full Details) */}
      <StudentProfileModal
        isOpen={!!selectedStudentForHistory}
        onClose={() => setSelectedStudentForHistory(null)}
        studentId={selectedStudentForHistory?._id}
      />

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl" style={{ width: '90%', maxWidth: 420, padding: 32 }}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mb-4">
              <X size={24} />
            </div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-2">Reject {rejectModal.isActivity ? 'Activity' : 'Certificate'}</h3>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">
              Are you sure you want to reject <strong className="text-[var(--text-primary)]">{rejectModal.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="flex-1 bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--bg-hover)] py-3 rounded-xl text-[13px] font-bold transition-colors" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="flex-1 bg-red-500 text-white hover:bg-red-600 py-3 rounded-xl text-[13px] font-bold transition-colors shadow-sm shadow-red-500/20 flex items-center justify-center gap-2"
                onClick={async () => {
                  setProcessing((p) => ({ ...p, [rejectModal._id]: 'reject' }));
                  let result;
                  if (rejectModal.isActivity) {
                    result = await dispatch(verifyActivity({ id: rejectModal._id, action: 'reject', reason: '' }));
                  } else {
                    result = await dispatch(verifyCertificate({ id: rejectModal._id, action: 'reject', reason: '' }));
                  }
                  setProcessing((p) => ({ ...p, [rejectModal._id]: null }));
                  setRejectModal(null);
                  if (!result.error) toast.success(`${rejectModal.isActivity ? 'Activity' : 'Certificate'} rejected!`);
                  else toast.error(result.payload);
                }}
                disabled={processing[rejectModal._id] === 'reject'}>
                {processing[rejectModal._id] === 'reject' ? <Loader2 size={16} className="animate-spin" /> : null}
                Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Activity Details Modal */}
      {activityDetailsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-[1.5rem]" style={{ width: '90%', maxWidth: 500, padding: 32 }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Activity Details</h3>
                <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">Review the submitted activity information.</p>
              </div>
              <button onClick={() => setActivityDetailsModal(null)} className="text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors border border-[var(--border-light)]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-3 gap-4 border-b border-[var(--border-light)] pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">Title</span>
                <span className="col-span-2 font-bold text-[var(--text-primary)]">{activityDetailsModal.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-[var(--border-light)] pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">Type</span>
                <span className="col-span-2 font-bold text-[var(--primary)] uppercase tracking-wider text-[11px] bg-purple-500/10 w-max px-2 py-0.5 rounded border border-purple-500/20">{activityDetailsModal.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">Platform</span>
                <span className="col-span-2 font-bold text-[var(--text-primary)]">{activityDetailsModal.platform || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-[var(--border-light)] pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">Duration</span>
                <span className="col-span-2 font-bold text-[var(--text-primary)]">{activityDetailsModal.duration || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-[var(--border-light)] pb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">Description</span>
                <span className="col-span-2 font-medium text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed bg-[var(--bg-input)] p-3 rounded-xl border border-[var(--border-light)]">{activityDetailsModal.description || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-0.5">Link</span>
                <span className="col-span-2 font-medium">
                  {activityDetailsModal.link ? (
                    <a href={activityDetailsModal.link} target="_blank" rel="noreferrer" className="text-[var(--primary)] font-bold hover:underline break-all">
                      {activityDetailsModal.link}
                    </a>
                  ) : <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-[var(--border-light)]">
              <button className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-3 rounded-xl text-[13px] font-bold transition-colors shadow-md shadow-purple-500/20" onClick={() => setActivityDetailsModal(null)}>Close Details</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
