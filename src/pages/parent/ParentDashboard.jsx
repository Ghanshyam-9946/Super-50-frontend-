import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  LogOut,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  MapPin,
  Sparkles,
  Layers,
  Check,
  UserCheck,
  Compass,
  ArrowUpRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  Star,
  Cpu,
  UserCheck2,
  Sun,
  Moon,
  Activity,
  User,
  ClipboardList,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import sistecLogo from '../../assets/SISTec_Logo.png';

export default function ParentDashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [allStudents, setAllStudents] = useState([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const storedStudents = localStorage.getItem('parent_all_students');
    if (storedStudents) {
      try {
        setAllStudents(JSON.parse(storedStudents));
      } catch (e) { }
    }
  }, []);

  const fetchStudentData = async (studentId) => {
    setLoading(true);
    try {
      const url = studentId ? `/parents/student-data?studentId=${studentId}` : '/parents/student-data';
      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch student data:', err);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('parent_all_students');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSwitchWard = async (student) => {
    setSwitching(true);
    try {
      const res = await api.post('/parents/login', {
        mobile: user?.parentMobile || '',
        studentId: student._id,
      });
      if (res.data.token) {
        localStorage.setItem('super50_token', res.data.token);
        localStorage.setItem('super50_user', JSON.stringify(res.data.user));
        toast.success(`Switched to ${student.name}`);
        fetchStudentData(student._id);
      }
    } catch (e) {
      toast.error('Could not switch ward');
    } finally {
      setSwitching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center text-[var(--text-primary)] px-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-[var(--primary)] animate-pulse">
          <Users size={28} />
        </div>
        <h3 className="text-base font-display font-black">Loading Ward Profile...</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Fetching verified academic records</p>
      </div>
    );
  }

  const student = data?.student || {};
  const rgpvResults = data?.rgpvResults || [];
  const semesterAttendance = data?.semesterAttendance || [];
  const attendanceLogs = data?.attendanceLogs || [];
  const mstResults = data?.mstResults || [];
  const amcatResults = data?.amcatResults || [];
  const certificates = data?.certificates || [];
  const activities = data?.activities || [];
  const team = data?.team || null;
  const placementApplications = data?.placementApplications || [];
  const super50Registration = data?.super50Registration || null;
  const noDuesForm = data?.noDuesForm || null;
  const studentSessionalMarks = data?.studentSessionalMarks || [];
  const podAI = data?.podAI || { marks: [], analytics: { totalTests: 0, averageMarks: 0, highestMarks: 0, totalMarks: 0 } };
  const podAIMarks = podAI.marks || data?.podAIMarks || [];
  const podAIAnalytics = podAI.analytics || { totalTests: podAIMarks.length, averageMarks: 0, highestMarks: 0, totalMarks: 0 };

  const attPercent = student.attendancePercentage || 0;
  const cgpa = student.cgpa || 0;
  const duesFees = student.duesFees || 0;

  const menuOptions = [
    { id: 'profile', icon: User, label: 'Overview', desc: 'Basic info, mentor & contact records', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { id: 'rgpv', icon: Award, label: 'RGPV Marks', desc: 'Official semester results & grade sheets', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'attendance', icon: Calendar, label: 'Attendance', desc: 'Semester breakdown & daily class logs', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
    { id: 'mst', icon: ClipboardList, label: 'MST Marks', desc: 'Subject-wise mid semester exam scores', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { id: 'amcat', icon: Cpu, label: 'AMCAT Marks', desc: 'Employability assessment scores', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { id: 'podai', icon: Target, label: 'Pod AI Marks', desc: 'Continuous assessment tests & AI scores', color: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20' },
    { id: 'projects', icon: BookOpen, label: 'PMS Projects', desc: 'Capstone project, guide & teammates', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { id: 'certificates', icon: Award, label: 'Certificates', desc: 'Verified technical & skill certificates', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { id: 'activities', icon: Activity, label: 'Activities', desc: 'Hackathons, internships & workshops', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { id: 'placements', icon: Briefcase, label: 'Placements & Super50', desc: 'Company drive applications & batch info', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    { id: 'clearance', icon: ShieldCheck, label: 'Fees & No Dues', desc: 'Departmental clearance checklist', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans pb-24 selection:bg-purple-500 selection:text-white transition-colors duration-300">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-light)] px-4 sm:px-8 py-3.5 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white p-1 flex items-center justify-center border border-[var(--border-light)] shadow-sm">
              <img src={sistecLogo} alt="SISTec" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-tight text-[var(--text-primary)]">
                  MILE<span className="text-[var(--primary)]">.</span>
                </span>
                <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">
                  Parent Portal
                </span>
              </div>
              <p className="text-[10px] font-bold text-[var(--text-secondary)]">
                Sagar Group of Institutions (SISTec)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multiple Wards Switcher */}
            {allStudents.length > 1 && (
              <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-1">
                {allStudents.map((w) => (
                  <button
                    key={w._id}
                    onClick={() => handleSwitchWard(w)}
                    disabled={switching || w._id === student._id}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${w._id === student._id
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                  >
                    {w.name?.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Theme Toggle if available */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
              title="Print Academic Report"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-500 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Read-Only Notice Badge */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-[var(--text-secondary)] font-medium">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={17} className="text-[var(--primary)] shrink-0" />
            <span>
              <strong>Parent Verified Access (Read-Only):</strong> Viewing live college records for{' '}
              <strong className="text-[var(--text-primary)]">{student.name}</strong> ({student.enrollmentNumber || student.enrollmentNo || 'N/A'}).
            </span>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-purple-500/10 border-2 border-[var(--border-light)] p-0.5 shadow-sm overflow-hidden flex items-center justify-center text-[var(--primary)]">
                  {student.profileImage ? (
                    <img
                      src={student.profileImage}
                      alt={student.name}
                      className="h-full w-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <GraduationCap size={32} />
                  )}
                </div>
                {student.isSuper50 && (
                  <span className="absolute -bottom-2 -right-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                    Super 50
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h1 className="text-xl sm:text-2xl font-display font-black text-[var(--text-primary)]">
                    {student.name}
                  </h1>
                  <span className="rounded-full bg-[var(--bg-input)] border border-[var(--border-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-secondary)]">
                    {student.enrollmentNumber || student.enrollmentNo}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[var(--text-secondary)] mt-1">
                  <span className="flex items-center gap-1 text-[var(--text-primary)]">
                    <Building2 size={13} className="text-[var(--primary)]" />
                    {student.department || 'Engineering'}
                  </span>
                  <span>•</span>
                  <span>Batch: <strong className="text-[var(--text-primary)]">{student.batch || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Sem: <strong className="text-[var(--text-primary)]">{student.semester ? `${student.semester}th` : 'N/A'}</strong></span>
                  {student.section && (
                    <>
                      <span>•</span>
                      <span>Section: <strong className="text-[var(--text-primary)]">{student.section}</strong></span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-light)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
                    {student.residenceType || 'Day Scholar'}
                  </span>
                  {student.email && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-input)] border border-[var(--border-light)] px-2.5 py-1 rounded-lg">
                      <Mail size={12} /> {student.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: TG Mentor Card */}
            {student.mentor && (
              <div className="w-full md:w-auto bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-purple-500/20">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    Assigned TG Mentor
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                    {student.mentor.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium">
                    {student.mentor.mobile && (
                      <a
                        href={`tel:${student.mentor.mobile}`}
                        className="flex items-center gap-1 font-bold text-[var(--primary)] hover:underline"
                        title="Call TG Mentor"
                      >
                        <Phone size={12} className="text-[var(--primary)] shrink-0" />
                        <span>{student.mentor.mobile}</span>
                      </a>
                    )}
                    {student.mentor.email && (
                      <a
                        href={`mailto:${student.mentor.email}`}
                        className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title="Email TG Mentor"
                      >
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span>{student.mentor.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High-Level KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Attendance */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
              <span>Attendance</span>
              <Calendar size={15} className="text-teal-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-black text-[var(--text-primary)]">
                {attPercent.toFixed(1)}%
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${attPercent >= 75
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}
              >
                {attPercent >= 75 ? 'Regular' : 'Low (<75%)'}
              </span>
            </div>
            <div className="w-full bg-[var(--bg-input)] rounded-full h-1.5 mt-3 overflow-hidden border border-[var(--border-light)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${attPercent >= 75 ? 'bg-teal-500' : 'bg-red-500'
                  }`}
                style={{ width: `${Math.min(attPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: CGPA */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
              <span>Cumulative CGPA</span>
              <GraduationCap size={15} className="text-[var(--primary)]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-display font-black text-[var(--text-primary)]">
                {cgpa > 0 ? cgpa.toFixed(2) : 'N/A'}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-bold">/ 10.0</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-3 flex items-center gap-1 font-medium">
              <span>10th: <strong className="text-[var(--text-primary)]">{student.tenthPercentage || 'N/A'}%</strong></span>
              <span>•</span>
              <span>12th: <strong className="text-[var(--text-primary)]">{student.twelfthPercentage || 'N/A'}%</strong></span>
            </div>
          </div>

          {/* Card 3: Fee Clearance */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
              <span>Fee & Dues</span>
              <ShieldCheck size={15} className="text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-black text-[var(--text-primary)]">
                {duesFees === 0 ? 'Clear' : `₹${duesFees.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="text-[11px] mt-3 font-semibold">
              {duesFees === 0 ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> No dues pending
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={13} /> Fee clearance required
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Placements & Activities */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
              <span>Certificates & Drives</span>
              <Briefcase size={15} className="text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-display font-black text-[var(--text-primary)]">
                {certificates.filter((c) => c.verified === 'approved').length}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-bold">Approved</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-3">
              Applied in <strong className="text-[var(--text-primary)]">{placementApplications.length}</strong> Campus Drives
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip / Back Button */}
        <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-3 pt-2 print:hidden">
          {activeTab !== 'menu' ? (
            <button
              onClick={() => setActiveTab('menu')}
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors bg-[var(--bg-card)] px-3.5 py-2 rounded-xl border border-[var(--border-light)] shadow-sm cursor-pointer"
            >
              ← Back to Main Menu
            </button>
          ) : (
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Select Module to View Details
            </span>
          )}

          {/* Horizontal mini-tabs when in a detail view */}
          {activeTab !== 'menu' && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {menuOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveTab(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === opt.id
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Options Menu Grid (When in 'menu' state, exactly like StudentProfileModal) */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveTab(opt.id)}
                  className="flex items-start gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-light)] hover:border-[var(--primary)]/40 hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className={`p-3 rounded-2xl border shrink-0 ${opt.color}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {opt.label}
                      </h4>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Detail View 1: Profile Overview */}
        {activeTab === 'profile' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Student Profile Overview</h3>
                <p className="text-xs text-[var(--text-secondary)]">Personal, Academic & Contact records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {[
                { label: 'Full Name', val: student.name },
                { label: 'Enrollment Number', val: student.enrollmentNumber || student.enrollmentNo },
                { label: 'Email Address', val: student.email || 'N/A' },
                { label: 'Department / Branch', val: student.department || 'N/A' },
                { label: 'Batch Year', val: student.batch || 'N/A' },
                { label: 'Current Semester', val: student.semester ? `${student.semester}th Semester` : 'N/A' },
                { label: 'Class Section', val: student.section || 'N/A' },
                { label: 'Residence Status', val: student.residenceType || 'Day Scholar' },
                { label: '10th Percentage', val: student.tenthPercentage ? `${student.tenthPercentage}%` : 'N/A' },
                { label: '12th Percentage', val: student.twelfthPercentage ? `${student.twelfthPercentage}%` : 'N/A' },
                { label: 'Parent Mobile on Record', val: student.parentMobile || user?.parentMobile || 'N/A' },
                { label: 'Student Mobile', val: student.mobile || 'N/A' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {item.label}
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {student.address && (
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] text-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Permanent Address
                </span>
                <span className="font-semibold text-[var(--text-primary)]">{student.address}</span>
              </div>
            )}

            {student.mentor && (
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-purple-500/20">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-[var(--primary)]">
                      Assigned Tutor Guardian (TG Mentor)
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                      {student.mentor.name} {student.mentor.designation ? `• ${student.mentor.designation}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {student.mentor.mobile && (
                    <a
                      href={`tel:${student.mentor.mobile}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] font-bold text-[var(--primary)] hover:brightness-110 shadow-sm transition-all"
                    >
                      <Phone size={13} /> {student.mentor.mobile}
                    </a>
                  )}
                  {student.mentor.email && (
                    <a
                      href={`mailto:${student.mentor.email}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all"
                    >
                      <Mail size={13} /> {student.mentor.email}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail View 2: RGPV Marks */}
        {activeTab === 'rgpv' && (
          <div className="space-y-4">
            {rgpvResults.length === 0 ? (
              <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-light)] p-12 text-center text-[var(--text-secondary)] shadow-sm">
                <Award size={36} className="mx-auto mb-2 text-slate-400" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">No RGPV Results Uploaded Yet</h4>
                <p className="text-xs mt-1">Official university grade cards will appear here once published by college administration.</p>
              </div>
            ) : (
              rgpvResults.map((r) => (
                <div
                  key={r._id}
                  className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-light)] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--primary)]">
                          Semester {r.semester}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${r.resultDecision === 'PASS'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 border border-red-500/20'
                            }`}
                        >
                          {r.resultDecision || 'PASS'}
                        </span>
                      </div>
                      <div className="text-base font-bold text-[var(--text-primary)] mt-1">
                        RGPV Semester {r.semester} Official Result
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-[var(--bg-input)] px-4 py-2 rounded-2xl border border-[var(--border-light)]">
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-400">SGPA</div>
                        <div className="text-lg font-display font-black text-[var(--primary)]">
                          {r.sgpa ? r.sgpa.toFixed(2) : 'N/A'}
                        </div>
                      </div>
                      <div className="h-7 w-px bg-[var(--border-light)]" />
                      <div>
                        <div className="text-[10px] uppercase font-black text-slate-400">CGPA</div>
                        <div className="text-lg font-display font-black text-[var(--text-primary)]">
                          {r.cgpa ? r.cgpa.toFixed(2) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {r.grades && Object.keys(r.grades).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-light)] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">Subject / Paper</th>
                            <th className="py-2.5 px-3 text-right">Awarded Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-light)] font-semibold">
                          {Object.entries(r.grades).map(([subject, grade]) => (
                            <tr key={subject} className="hover:bg-[var(--bg-hover)] transition-colors">
                              <td className="py-2.5 px-3 text-[var(--text-primary)] font-bold">{subject}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${['A+', 'A', 'B+', 'B', 'PASS', 'O'].includes(String(grade).toUpperCase())
                                      ? 'bg-emerald-500/10 text-emerald-600'
                                      : ['F', 'FAIL', 'AB'].includes(String(grade).toUpperCase())
                                        ? 'bg-red-500/10 text-red-600'
                                        : 'bg-purple-500/10 text-[var(--primary)]'
                                    }`}
                                >
                                  {String(grade)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--text-secondary)] italic">No individual subject breakdown recorded for this semester.</div>
                  )}
                </div>
              ))
            )}

            {/* Sessional Marks If Available */}
            {studentSessionalMarks.length > 0 && (
              <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-[var(--primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Internal / Sessional Marks</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-light)] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Subject Code</th>
                        <th className="py-2.5 px-3">Evaluation Type</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                        <th className="py-2.5 px-3 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)] font-semibold">
                      {studentSessionalMarks.map((s, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                          <td className="py-2.5 px-3 text-[var(--text-primary)] font-bold">{s.subjectName}</td>
                          <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.subjectCode}</td>
                          <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.examType || 'Internal'}</td>
                          <td className="py-2.5 px-3 text-right text-[var(--primary)] font-bold">
                            {s.marks} / {s.maxMarks}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] font-bold border border-[var(--border-light)]">
                              {s.grade || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail View 3: Attendance Records */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Semester-Wise Attendance</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Class participation and credit records</p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 font-bold text-xs">
                  Overall: {attPercent.toFixed(1)}%
                </div>
              </div>

              {semesterAttendance.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] text-xs">
                  No semester attendance history recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {semesterAttendance.map((sem) => (
                    <div
                      key={sem._id}
                      className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          Semester {sem.semester}
                        </span>
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-full ${sem.attendancePercentage >= 75
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-red-500/10 text-red-600'
                            }`}
                        >
                          {sem.attendancePercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-card)] rounded-full h-1.5 overflow-hidden border border-[var(--border-light)]">
                        <div
                          className={`h-full rounded-full ${sem.attendancePercentage >= 75 ? 'bg-teal-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${Math.min(sem.attendancePercentage || 0, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1">
                        <span>Classes: {sem.attendedClasses || '-'} / {sem.totalClasses || '-'}</span>
                        {sem.extraAttendanceCredit > 0 && (
                          <span className="text-emerald-600 font-semibold">+{sem.extraAttendanceCredit}% credit</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Logs */}
            {attendanceLogs.length > 0 && (
              <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Recent Attendance Logs</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Daily class & session roll calls</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-light)] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Subject / Session</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)] font-semibold">
                      {attendanceLogs.slice(0, 15).map((log, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                          <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                            {log.date ? new Date(log.date).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--text-primary)] font-bold">
                            {log.subject || log.topic || 'Super 50 Training Session'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${log.status === 'present' || log.isPresent
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-red-500/10 text-red-600'
                                }`}
                            >
                              {log.status === 'present' || log.isPresent ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail View 4: MST Scores */}
        {activeTab === 'mst' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                <ClipboardList size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Mid-Semester Tests (MST)</h3>
                <p className="text-xs text-[var(--text-secondary)]">Internal college mid-term exam marks</p>
              </div>
            </div>

            {mstResults.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-secondary)] text-xs">
                No MST test records uploaded yet.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {mstResults.map((mst) => (
                  <div key={mst._id} className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                        Semester {mst.semester} — {mst.examName || 'Mid Semester Test'}
                      </span>
                    </div>
                    {mst.subjects && Object.keys(mst.subjects).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {Object.entries(mst.subjects).map(([sub, mark]) => (
                          <div key={sub} className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-light)]">
                            <div className="text-[11px] font-bold text-[var(--text-secondary)] truncate">{sub}</div>
                            <div className="text-sm font-black text-[var(--text-primary)] mt-1">{String(mark)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-secondary)]">No subject marks breakdown recorded.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail View 5: AMCAT Scores */}
        {activeTab === 'amcat' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">AMCAT Employability Assessment</h3>
                <p className="text-xs text-[var(--text-secondary)]">Industry readiness & aptitude analytics</p>
              </div>
            </div>

            {amcatResults.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-secondary)] text-xs">
                No AMCAT scores uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {amcatResults.map((amcat) => (
                  <div key={amcat._id} className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-600">
                      <span>Semester {amcat.semester} Assessment</span>
                      <span>Total: {amcat.totalScore || 'N/A'}</span>
                    </div>
                    <div className="space-y-2 text-xs divide-y divide-[var(--border-light)]">
                      <div className="flex justify-between pt-1 text-[var(--text-secondary)]">
                        <span>Quantitative Ability:</span>
                        <strong className="text-[var(--text-primary)]">{amcat.quantitative || '-'}</strong>
                      </div>
                      <div className="flex justify-between pt-1 text-[var(--text-secondary)]">
                        <span>Logical Reasoning:</span>
                        <strong className="text-[var(--text-primary)]">{amcat.logical || '-'}</strong>
                      </div>
                      <div className="flex justify-between pt-1 text-[var(--text-secondary)]">
                        <span>English Comprehension:</span>
                        <strong className="text-[var(--text-primary)]">{amcat.english || '-'}</strong>
                      </div>
                      <div className="flex justify-between pt-1 text-[var(--text-secondary)]">
                        <span>Domain Knowledge:</span>
                        <strong className="text-[var(--text-primary)]">{amcat.domain || '-'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail View: Pod AI Marks & Assessment Analytics */}
        {activeTab === 'podai' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center border border-fuchsia-500/20">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Pod AI Assessment Marks</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Continuous evaluated tests, quizzes & AI assessment performance</p>
                </div>
              </div>

              {podAIMarks.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs font-bold text-fuchsia-600">
                  <Sparkles size={14} />
                  <span>{podAIAnalytics.totalTests} Assessments Recorded</span>
                </div>
              )}
            </div>

            {/* Analytics KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Tests</div>
                  <div className="text-xl font-display font-black text-[var(--text-primary)] mt-0.5">
                    {podAIAnalytics.totalTests}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Score</div>
                  <div className="text-xl font-display font-black text-[var(--text-primary)] mt-0.5">
                    {podAIAnalytics.averageMarks ? podAIAnalytics.averageMarks.toFixed(1) : '0.0'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Highest Score</div>
                  <div className="text-xl font-display font-black text-[var(--text-primary)] mt-0.5">
                    {podAIAnalytics.highestMarks || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment History Table */}
            {podAIMarks.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <Target size={40} className="mx-auto mb-2.5 text-slate-400 opacity-40" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">No Pod AI Marks Uploaded Yet</h4>
                <p className="text-xs mt-1">Student test scores will appear here once submitted and published by mentors/faculty.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-input)] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-[var(--border-light)]">
                    <tr>
                      <th className="px-5 py-3.5">Assessment / Test Name</th>
                      <th className="px-5 py-3.5">Semester</th>
                      <th className="px-5 py-3.5">Test Date</th>
                      <th className="px-5 py-3.5 text-right">Marks Obtained</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {podAIMarks.map((mark, i) => (
                      <tr key={mark._id || i} className="hover:bg-[var(--bg-input)]/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-[var(--text-primary)]">
                          {mark.testName}
                        </td>
                        <td className="px-5 py-4 font-semibold text-[var(--text-secondary)]">
                          {mark.semester ? `Semester ${mark.semester}` : 'General'}
                        </td>
                        <td className="px-5 py-4 text-[var(--text-secondary)] font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            {mark.testDate ? new Date(mark.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-black bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/20 shadow-sm">
                            {mark.marks}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Detail View 6: PMS Projects */}
        {activeTab === 'projects' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">PMS Major / Minor Academic Project</h3>
                <p className="text-xs text-[var(--text-secondary)]">Project Monitoring System team details</p>
              </div>
            </div>

            {team ? (
              <div className="p-5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-violet-600">
                    Project Title
                  </div>
                  <div className="text-sm font-bold text-[var(--text-primary)] mt-1">
                    {team.title || team.projectTitle || 'Capstone Academic Project'}
                  </div>
                  {team.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {team.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-light)] text-xs">
                  <div>
                    <span className="text-[var(--text-secondary)]">Faculty Project Guide:</span>
                    <div className="text-[var(--text-primary)] font-bold mt-0.5">
                      {team.guide?.name || 'Assigned Guide'} ({team.guide?.email || 'N/A'})
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Team Leader:</span>
                    <div className="text-[var(--text-primary)] font-bold mt-0.5">
                      {team.teamLeader?.name || student.name}
                    </div>
                  </div>
                </div>

                {team.members && team.members.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[var(--text-secondary)] text-xs block mb-1.5">Project Teammates:</span>
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-light)] text-[11px] font-semibold text-[var(--text-primary)]"
                        >
                          {m.student?.name || m.name || 'Student'} ({m.student?.enrollmentNumber || m.enrollmentNumber || ''})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)] text-xs">
                No active PMS project team assigned yet.
              </div>
            )}
          </div>
        )}

        {/* Detail View 7: Certificates */}
        {activeTab === 'certificates' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Certificates & Recognitions</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Technical, course and achievement certifications</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)]">Total: {certificates.length}</span>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)] text-xs">
                No certificates submitted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {certificates.map((cert) => (
                  <div
                    key={cert._id}
                    className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-2 hover:border-[var(--primary)]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">
                        {cert.title}
                      </div>
                      <span
                        className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 ${cert.verified === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : cert.verified === 'rejected'
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                      >
                        {cert.verified || 'Pending'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {cert.organization || 'Issuing Body'} • {cert.category || 'Skill'}
                    </div>
                    {cert.issueDate && (
                      <div className="text-[10px] text-slate-400">
                        Issued: {new Date(cert.issueDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail View 8: Activities */}
        {activeTab === 'activities' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Extracurricular Activities</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Hackathons, internships, workshops & coding competitions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)]">Total: {activities.length}</span>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)] text-xs">
                No activity logs submitted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {activities.map((act) => (
                  <div key={act._id} className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{act.title}</span>
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        {act.type}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{act.description}</p>
                    )}
                    {act.createdAt && (
                      <div className="text-[10px] text-slate-400">
                        Date: {new Date(act.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail View 9: Placements & Super 50 */}
        {activeTab === 'placements' && (
          <div className="space-y-4">
            {/* Super 50 Status */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-[var(--primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Super 50 Elite Batch Status</h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${student.isSuper50
                      ? 'bg-purple-500/10 text-[var(--primary)] border border-purple-500/20'
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-light)]'
                    }`}
                >
                  {student.isSuper50 ? 'Enrolled in Super 50' : 'General Batch Track'}
                </span>
              </div>

              {super50Registration ? (
                <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Selected Track:</span>
                    <strong className="text-[var(--text-primary)]">{super50Registration.domain || 'Software Development'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Selection Status:</span>
                    <strong className="text-[var(--primary)]">{super50Registration.status || 'Active'}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  {student.isSuper50
                    ? 'Student is regularly attending advanced Super 50 training sessions.'
                    : 'Information regarding Super 50 selection batches will be shared by the department.'}
                </p>
              )}
            </div>

            {/* Placement Applications */}
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Campus Placement Drives</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Corporate recruitment applications & shortlists</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">Applied: {placementApplications.length}</span>
              </div>

              {placementApplications.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] text-xs">
                  No placement drive applications recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-light)] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Package</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)] font-semibold">
                      {placementApplications.map((app) => (
                        <tr key={app._id} className="hover:bg-[var(--bg-hover)]">
                          <td className="py-2.5 px-3 text-[var(--text-primary)] font-bold">
                            {app.drive?.companyName || 'Campus Recruiter'}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                            {app.drive?.jobRole || 'Engineer Trainee'}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--primary)] font-bold">
                            {app.drive?.package || 'Industry Norms'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${app.status === 'selected' || app.status === 'offered'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : app.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-cyan-500/10 text-cyan-600'
                                }`}
                            >
                              {app.status || 'Applied'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detail View 10: Clearances & Fees */}
        {activeTab === 'clearance' && (
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Semester No-Dues Clearances</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Official college departmental sign-off status</p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-xl text-xs font-bold ${duesFees === 0
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
              >
                {duesFees === 0 ? 'No Dues Pending' : `Pending: ₹${duesFees}`}
              </div>
            </div>

            {noDuesForm ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'TG Mentor Clearance', status: noDuesForm.mentorStatus },
                  { label: 'Head of Department (HOD)', status: noDuesForm.hodStatus },
                  { label: 'Accounts & Fees Clearance', status: noDuesForm.accountsStatus },
                  { label: 'Central Library Clearance', status: noDuesForm.libraryStatus },
                  { label: 'Laboratory / Workshop', status: noDuesForm.labStatus },
                  { label: 'Hostel / Sports Clearance', status: noDuesForm.hostelStatus },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
                    <span
                      className={`font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full ${['approved', 'cleared', 'signed'].includes(String(item.status).toLowerCase())
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                        }`}
                    >
                      {item.status || 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] text-xs text-[var(--text-secondary)] space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle2 size={16} /> All college departmental clearances are in order.
                </div>
                <p>Digital No-Dues form will be activated during semester final examination clearance windows.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
