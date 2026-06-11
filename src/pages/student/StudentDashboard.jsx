import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMyProfile } from '../../features/students/studentsSlice';
import ScoreRing from '../../components/ScoreRing';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Award, Zap, Calendar, TrendingUp, Link as RouterLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Super50Card from '../../components/Super50Card';
import CertificateCard from '../../components/CertificateCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6B7280', font: { size: 12, family: 'Inter', weight: '500' } }, border: { display: false } },
    y: { grid: { color: '#E5E7EB', borderDash: [4, 4] }, ticks: { color: '#6B7280', font: { size: 12, family: 'Inter' } }, border: { display: false } },
  },
  responsive: true,
  maintainAspectRatio: false,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const { myProfile, loading } = useSelector((state) => state.students);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  const student = myProfile?.student || user;
  const stats = myProfile?.stats || {};
  const certificates = myProfile?.certificates || [];

  const activityTypes = ['coding', 'internship', 'project', 'hackathon', 'workshop', 'other'];
  const activityData = useMemo(
    () => ({
      labels: activityTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
      datasets: [
        {
          data: activityTypes.map((t) => stats.activityBreakdown?.[t] || 0),
          backgroundColor: [
            '#8B5CF6',
            '#A855F7',
            '#7C3AED',
            '#6366f1',
            '#c084fc',
            '#e2e8f0',
          ],
          borderRadius: 8,
          barThickness: 32,
        },
      ],
    }),
    [stats.activityBreakdown]
  );

  const statCards = useMemo(
    () => [
      {
        icon: TrendingUp,
        label: 'Performance Score',
        value: Math.round(student?.performanceScore || 0),
        unit: '/100',
        color: 'var(--primary)',
        bg: 'rgba(139, 92, 246, 0.1)',
      },
      {
        icon: Calendar,
        label: 'Attendance',
        value: Math.round(student?.attendancePercentage || 0),
        unit: '%',
        color: 'var(--primary-dark)',
        bg: 'rgba(124, 58, 237, 0.1)',
      },
      {
        icon: Award,
        label: 'Certificates',
        value: stats.approvedCertificates || 0,
        unit: ' approved',
        color: 'var(--primary-light)',
        bg: 'rgba(168, 85, 247, 0.1)',
      },
      {
        icon: Zap,
        label: 'Activities',
        value: stats.totalActivities || 0,
        unit: ' total',
        color: 'var(--brand-indigo)',
        bg: 'rgba(99, 102, 241, 0.1)',
      },
    ],
    [student, stats]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Hello, <span className="text-gradient">{student?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-bold text-[11px] uppercase tracking-[0.15em] mt-2 opacity-80">
            {student?.department} • Batch {student?.batch} • {student?.enrollmentNumber}
          </p>
        </div>
      </motion.header>

      {/* Stat Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map(({ icon: Icon, label, value, unit, color, bg }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            className="glass-card p-6 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: bg, color }}>
                <Icon size={22} />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-60 uppercase tracking-widest">Real-time</span>
            </div>
            <div>
              <div className="text-4xl font-display font-black text-[var(--text-primary)] tracking-tight">
                {value}
                <span className="text-sm font-bold text-[var(--text-secondary)] ml-1 opacity-70">{unit}</span>
              </div>
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">
                {label}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Side: Super 50 Portal (lg:col-span-4) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
          <Super50Card />
        </motion.div>

        {/* Right Side: Score & Activity (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-8 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Score Ring */}
            <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col items-center justify-between">
              <h3 className="text-[var(--text-primary)] font-bold text-lg mb-6 w-full">
                Performance Breakdown
              </h3>
              <div className="flex-grow flex items-center justify-center my-4">
                <ScoreRing score={student?.performanceScore || 0} size={180} />
              </div>
              <div className="mt-6 w-full space-y-4">
                {[
                  { label: 'Attendance', value: (student?.attendancePercentage || 0) * 0.3, maxVal: 30, color: 'var(--primary-dark)' },
                  { label: 'Certificates', value: Math.min((stats.approvedCertificates || 0) * 10, 30), maxVal: 30, color: 'var(--primary-light)' },
                  { label: 'Activities', value: Math.min((stats.totalActivities || 0) * 5, 40), maxVal: 40, color: 'var(--brand-indigo)' },
                ].map(({ label, value, maxVal, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5 text-[var(--text-secondary)] font-bold">
                      <span>{label}</span>
                      <span style={{ color }}>{Math.round(value)}/{maxVal}</span>
                    </div>
                    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min((value / maxVal) * 100, 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Chart */}
            <motion.div variants={itemVariants} className="glass-card p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-[var(--text-primary)] font-bold text-lg">Activity History</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1 font-medium">Logged activities by type</p>
              </div>
              <div className="flex-grow min-h-[220px] mt-8 relative">
                <Bar data={activityData} options={chartDefaults} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Certificates Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Recent Certificates</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1 font-medium">Your uploaded certifications and verification status</p>
          </div>
          <Link to="/certificates" className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors uppercase tracking-widest">
            View All →
          </Link>
        </div>
        
        {certificates.length === 0 ? (
          <div className="text-center py-16 bg-[#F8FAFC] rounded-2xl border border-[var(--border-light)] border-dashed">
            <Award size={48} className="mx-auto mb-4 text-[#CBD5E1]" />
            <p className="font-bold text-[var(--text-secondary)] text-sm">No certificates uploaded yet</p>
            <Link to="/certificates" className="mt-4 btn-premium py-2 px-6">
              Upload Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {certificates.slice(0, 3).map((cert) => (
              <CertificateCard key={cert._id} cert={cert} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
