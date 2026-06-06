import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminStats, fetchAllStudents } from '../../features/students/studentsSlice';
import { fetchPendingCertificates, verifyCertificate } from '../../features/certificates/certificatesSlice';
import { fetchPendingActivities, verifyActivity } from '../../features/activities/activitiesSlice';
import { fetchFacultyReviewQueue } from '../../features/resume/resumeSlice';
import {
  Users, Award, TrendingUp, ClipboardList,
  ShieldCheck, Clock, FileText, Search,
  ChevronRight, Filter, Download, Star, UserPlus, Briefcase, X, Check, Loader2, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import StudentProfileModal from '../../components/StudentProfileModal';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { adminStats, allStudents, filters } = useSelector((s) => s.students);
  const { pendingCertificates } = useSelector((s) => s.certificates);
  const { pendingActivities } = useSelector((s) => s.activities);
  const { facultyResumes } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);

  const [selectedDept, setSelectedDept] = useState('All');
  const [processing, setProcessing] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [activityDetailsModal, setActivityDetailsModal] = useState(null);

  // Placement History Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAllStudents());
    dispatch(fetchPendingCertificates());
    dispatch(fetchPendingActivities());
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
    { icon: Users, label: 'Super 50 Students', value: adminStats?.super50Count || 0, color: 'var(--brand-indigo)', bg: 'rgba(var(--brand-indigo-rgb),0.1)' },
    { icon: Users, label: 'Regular Students', value: adminStats?.regularCount || 0, color: 'var(--brand-purple)', bg: 'rgba(var(--brand-purple-rgb),0.1)' },
    { icon: TrendingUp, label: 'Avg Performance', value: `${Math.round(adminStats?.stats?.avgScore || 0)}`, unit: '/100', color: 'var(--brand-orange)', bg: 'rgba(var(--brand-orange-rgb),0.1)' },
    { icon: FileText, label: 'Resumes to Review', value: facultyResumes.length, color: 'var(--brand-indigo)', bg: 'rgba(var(--brand-indigo-rgb),0.1)' },
  ], [adminStats, facultyResumes]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-4xl font-black text-gradient tracking-tighter">
            {user?.role === 'admin' ? '⚙️ Enterprise' : user?.role === 'super50_admin' ? '🌟 Super50 Admin' : '👩‍🏫 Faculty'} Dashboard
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Monitoring {adminStats?.totalStudents || 0} students across {filters.departments?.length || 0} departments.</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/bulk-create" className="btn-premium flex items-center gap-2 text-xs header-btn">
                <UserPlus size={16} /> Onboard (Excel)
              </Link>
              <Link to="/admin/drive-eligibility" className="btn-premium flex items-center gap-2 text-xs header-btn">
                <Briefcase size={16} /> Eligibility (Excel)
              </Link>
              <Link to="/admin/drive-results" className="btn-outline-premium flex items-center gap-2 text-xs header-btn">
                <ClipboardList size={16} /> Results (Excel)
              </Link>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'super50_admin') && (
            <Link to="/admin/super50-selection" className="btn-premium flex items-center gap-2 text-xs header-btn">
              <Star size={16} /> Super 50
            </Link>
          )}
        </div>
      </header>

      {/* Student Placement History Search */}
      <div className="relative z-40">
        <div className={`glass border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 transition-all ${isSearchFocused ? 'ring-2 ring-purple-500/35 shadow-md' : ''}`}>
          <Search className="text-slate-600" size={20} />
          <input
            type="text"
            placeholder="Search student by name or enrollment number to view full profile & placements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-sm font-bold"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-600 hover:text-slate-900">
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
              className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
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
                    className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                        className="w-10 h-10 rounded-full border border-slate-200"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{student.name}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{student.enrollmentNumber || 'N/A'} • {student.department}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-900 transition-colors group-hover:translate-x-1" />
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
            className="glass border border-slate-200/50 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl" style={{ background: card.bg, color: card.color }}>
                <card.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">
                {card.value}
                <span className="text-sm font-bold text-slate-500 ml-1">{card.unit}</span>
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {user?.role === 'teacher' ? (
        <div className="glass border border-slate-200/50 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900">🎓 Student & Placement Directory</h3>
              <p className="text-sm text-slate-500 mt-1">Search or browse students to view their full profile, activities, and detailed placement tracking.</p>
            </div>
            <Link to="/teacher/students" className="btn-premium text-xs px-4 py-2 flex items-center gap-2">
              <Users size={16} /> View Complete List
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allStudents.slice(0, 8).map((student) => (
              <div key={student._id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                    className="w-12 h-12 rounded-full border-2 border-slate-100"
                    alt={student.name}
                  />
                  <div>
                    <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {student.name}
                      {student.isSuper50 && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-purple-200">Super 50</span>}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {student.enrollmentNumber} • {student.department}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudentForHistory(student)}
                  className="btn-outline-premium text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Eye size={14} /> Full Profile & Placements
                </button>
              </div>
            ))}
          </div>
          {allStudents.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-bold text-sm uppercase tracking-widest">
              No students found in directory
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Chart */}
        <div className="lg:col-span-2 glass border border-slate-200/50 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Performance Score Distribution</h3>
              <p className="text-xs text-slate-500 mt-1">Total student counts by score range</p>
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
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
        <div className="glass border border-slate-200/50 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-8">🏆 Top Performers</h3>
          <div className="space-y-6">
            {(adminStats?.topStudents || []).map((student, i) => (
              <div key={student._id} className="flex items-center gap-4 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                  i === 1 ? 'bg-gray-400/20 text-slate-500' :
                    'bg-orange-500/20 text-orange-600'
                  }`}>
                  #{i + 1}
                </div>
                <img
                  src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                  className="w-10 h-10 rounded-full border-2 border-slate-100 group-hover:scale-110 transition-transform"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-slate-900">{student.name}</div>
                    {student.isSuper50 && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{student.department}</div>
                </div>
                <div className="text-xl font-black text-purple-600">{Math.round(student.performanceScore)}</div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-xs font-black uppercase tracking-widest text-purple-600 border border-purple-500/20 rounded-xl hover:bg-purple-600/10 transition-all font-bold">
            View Full Leaderboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resume Review Queue */}
        <div className="glass border border-slate-200/50 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Resume Review Queue</h3>
            <span className="bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
              {facultyResumes.length} Pending
            </span>
          </div>
          <div className="space-y-4">
            {facultyResumes.slice(0, 4).map((resume) => (
              <div key={resume._id} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-100/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <FileText className="text-rose-500" size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{resume.student?.name}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Awaiting Review</div>
                  </div>
                </div>
                <button className="p-2 text-slate-500 hover:text-purple-600 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
            {facultyResumes.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                Queue is clear
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications / System Alerts */}
        <div className="glass border border-slate-200/50 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-8">System Alerts</h3>
          <div className="space-y-6">
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Certificate & Activity Verification</div>
                <p className="text-xs text-slate-600 mt-1">There are {pendingCertificates.length} certificates and {pendingActivities?.length || 0} activities waiting for your approval.</p>
                <Link to="/admin/verify" className="inline-block mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                  Verify Now →
                </Link>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-500">
                <Star size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Super 50 Selection</div>
                <p className="text-xs text-slate-600 mt-1">Unlock premium features for high-performing students.</p>
                <Link to="/admin/super50-selection" className="inline-block mt-2 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
                  Open Portal →
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Certificates Approval for Dashboard */}
          {pendingCertificates.length > 0 && (
            <div className="mt-8 border-t border-slate-200/60 pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Pending Certificates</h3>
              <div className="space-y-4">
                {pendingCertificates.slice(0, 5).map((cert) => (
                  <div key={cert._id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{cert.title}</div>
                      <div className="text-xs text-slate-500">By {cert.student?.name} • {cert.issuedBy}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="btn-success flex items-center gap-1 py-1.5 px-3 text-xs"
                        onClick={async () => {
                          setProcessing((p) => ({ ...p, [cert._id]: 'approve' }));
                          const result = await dispatch(verifyCertificate({ id: cert._id, action: 'approve' }));
                          setProcessing((p) => ({ ...p, [cert._id]: null }));
                          if (!result.error) toast.success('Certificate approved!');
                          else toast.error(result.payload);
                        }}
                        disabled={!!processing[cert._id]}
                      >
                        {processing[cert._id] === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Approve
                      </button>
                      <button
                        className="btn-danger flex items-center gap-1 py-1.5 px-3 text-xs"
                        onClick={() => setRejectModal(cert)}
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCertificates.length > 5 && (
                  <Link to="/admin/verify" className="block text-center mt-2 text-xs font-bold text-purple-600 hover:text-purple-700">
                    View all {pendingCertificates.length} certificates →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Pending Activities Approval for Dashboard */}
          {pendingActivities?.length > 0 && (
            <div className="mt-8 border-t border-slate-200/60 pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Pending Activities</h3>
              <div className="space-y-4">
                {pendingActivities.slice(0, 5).map((act) => (
                  <div key={act._id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{act.title}</div>
                      <div className="text-xs text-slate-500">By {act.student?.name} • {act.type}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="btn-outline-premium flex items-center gap-1 py-1.5 px-3 text-xs"
                        onClick={() => setActivityDetailsModal(act)}
                      >
                        <Eye size={12} /> Details
                      </button>
                      <button
                        className="btn-success flex items-center gap-1 py-1.5 px-3 text-xs"
                        onClick={async () => {
                          setProcessing((p) => ({ ...p, [act._id]: 'approve' }));
                          const result = await dispatch(verifyActivity({ id: act._id, action: 'approve' }));
                          setProcessing((p) => ({ ...p, [act._id]: null }));
                          if (!result.error) toast.success('Activity approved!');
                          else toast.error(result.payload);
                        }}
                        disabled={!!processing[act._id]}
                      >
                        {processing[act._id] === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Approve
                      </button>
                      <button
                        className="btn-danger flex items-center gap-1 py-1.5 px-3 text-xs"
                        onClick={() => setRejectModal({ ...act, isActivity: true })}
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Student Directory Preview for Dashboard */}
          {user?.role !== 'teacher' && (
            <div className="mt-8 border-t border-slate-200/60 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Student Directory Preview</h3>
                <Link to="/teacher/students" className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
                  View All {allStudents.length} Students →
                </Link>
              </div>
              <div className="space-y-3">
                {allStudents.slice(0, 5).map((student) => (
                  <div key={student._id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                        className="w-10 h-10 rounded-full border border-slate-200"
                        alt={student.name}
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {student.name}
                          {student.isSuper50 && <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-black">Super 50</span>}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{student.enrollmentNumber} • {student.department}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStudentForHistory(student)}
                      className="btn-outline-premium text-xs py-1.5 px-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye size={14} /> View Profile
                    </button>
                  </div>
                ))}
                {allStudents.length === 0 && (
                  <div className="text-center py-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ width: '90%', maxWidth: 420, padding: 28 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--danger)' }}>Reject Certificate</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Rejecting: <strong style={{ color: 'var(--text-primary)' }}>{rejectModal.title}</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}
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
                {processing[rejectModal._id] === 'reject' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={14} />} Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Activity Details Modal */}
      {activityDetailsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ width: '90%', maxWidth: 500, padding: 28 }}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-900">Activity Details</h3>
              <button onClick={() => setActivityDetailsModal(null)} className="text-slate-500 hover:text-slate-900 bg-slate-50 p-1 rounded-md">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 text-sm mt-4">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Title</span>
                <span className="col-span-2 font-medium text-slate-900">{activityDetailsModal.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Type</span>
                <span className="col-span-2 font-medium text-slate-900 uppercase">{activityDetailsModal.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Platform</span>
                <span className="col-span-2 font-medium text-slate-900">{activityDetailsModal.platform || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Duration</span>
                <span className="col-span-2 font-medium text-slate-900">{activityDetailsModal.duration || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Description</span>
                <span className="col-span-2 font-medium text-slate-900 whitespace-pre-wrap">{activityDetailsModal.description || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Link</span>
                <span className="col-span-2 font-medium">
                  {activityDetailsModal.link ? (
                    <a href={activityDetailsModal.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all">
                      {activityDetailsModal.link}
                    </a>
                  ) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <button className="btn-secondary px-4" onClick={() => setActivityDetailsModal(null)}>Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
