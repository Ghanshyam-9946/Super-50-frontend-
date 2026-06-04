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
import { Award, Zap, Calendar, TrendingUp, Star, Link as RouterLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Super50Card from '../../components/Super50Card';
import CertificateCard from '../../components/CertificateCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
  },
  responsive: true,
  maintainAspectRatio: false,
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
            'var(--brand-indigo)',
            'var(--brand-purple)',
            'var(--brand-orange)',
            '#f59e0b',
            '#f97316',
            '#64748b',
          ],
          borderRadius: 6,
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
        color: 'var(--brand-indigo)',
        bg: 'rgba(var(--brand-indigo-rgb),0.1)',
      },
      {
        icon: Calendar,
        label: 'Attendance',
        value: Math.round(student?.attendancePercentage || 0),
        unit: '%',
        color: 'var(--brand-purple)',
        bg: 'rgba(var(--brand-purple-rgb),0.1)',
      },
      {
        icon: Award,
        label: 'Certificates',
        value: stats.approvedCertificates || 0,
        unit: ' approved',
        color: 'var(--brand-orange)',
        bg: 'rgba(var(--brand-orange-rgb),0.1)',
      },
      {
        icon: Zap,
        label: 'Activities',
        value: stats.totalActivities || 0,
        unit: ' total',
        color: 'var(--brand-indigo)',
        bg: 'rgba(var(--brand-indigo-rgb),0.1)',
      },
    ],
    [student, stats]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <header className="glass p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-black text-gradient tracking-tight">
            Hello, <span className="text-purple-600">{student?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            {student?.department} • Batch {student?.batch} • {student?.enrollmentNumber}
          </p>
        </motion.div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ icon: Icon, label, value, unit, color, bg }, i) => (
          <motion.div
            key={label}
            className="glass p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.02] duration-300 border border-slate-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border" style={{ background: bg, color, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Icon size={22} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real-time</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">
                {value}
                <span className="text-sm font-bold text-slate-500 ml-1">{unit}</span>
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                {label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Super 50 Portal (lg:col-span-4) */}
        <div className="lg:col-span-4">
          <Super50Card />
        </div>

        {/* Right Side: Score & Activity (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Ring */}
            <motion.div 
              className="glass p-6 rounded-3xl flex flex-col items-center justify-between min-h-[380px]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-slate-900 font-bold text-base mb-6 w-full">
                Performance Score
              </h3>
              <div className="flex-grow flex items-center justify-center">
                <ScoreRing score={student?.performanceScore || 0} size={160} />
              </div>
              <div className="mt-6 w-full space-y-3">
                {[
                  { label: 'Attendance (30%)', value: (student?.attendancePercentage || 0) * 0.3, maxVal: 30, color: 'var(--brand-purple)' },
                  { label: 'Certificates (30%)', value: Math.min((stats.approvedCertificates || 0) * 10, 30), maxVal: 30, color: 'var(--brand-orange)' },
                  { label: 'Activities (40%)', value: Math.min((stats.totalActivities || 0) * 5, 40), maxVal: 40, color: 'var(--brand-indigo)' },
                ].map(({ label, value, maxVal, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1 text-slate-500 font-bold">
                      <span>{label}</span>
                      <span style={{ color }}>{Math.round(value)}/{maxVal}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
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
            <motion.div 
              className="glass p-6 rounded-3xl flex flex-col justify-between min-h-[380px]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div>
                <h3 className="text-slate-900 font-bold text-base">Activity Breakdown</h3>
                <p className="text-xs text-slate-500 mt-1">Logged activities count by type</p>
              </div>
              <div className="flex-grow min-h-[220px] mt-6 relative">
                <Bar data={activityData} options={chartDefaults} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="glass p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Recent Certificates</h3>
            <p className="text-xs text-slate-500 mt-1">Your uploaded certifications and verification status</p>
          </div>
          <Link to="/certificates" className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-wider">
            View All →
          </Link>
        </div>
        {certificates.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Award size={48} className="mx-auto opacity-30 mb-3 text-slate-500" />
            <p className="font-medium text-sm">No certificates uploaded yet</p>
            <Link to="/certificates" className="mt-3 inline-block text-xs font-bold text-purple-600 hover:underline">
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
      </div>
    </div>
  );
}
