import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMyProfile } from '../../features/students/studentsSlice';
import ScoreRing from '../../components/ScoreRing';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Award, Zap, Calendar, TrendingUp } from 'lucide-react';

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

  useEffect(() => { dispatch(fetchMyProfile()); }, [dispatch]);

  const student = myProfile?.student || user;
  const stats = myProfile?.stats || {};
  const activities = myProfile?.activities || [];
  const certificates = myProfile?.certificates || [];

  const activityTypes = ['coding', 'internship', 'project', 'hackathon', 'workshop', 'other'];
  const activityData = {
    labels: activityTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
    datasets: [{
      data: activityTypes.map((t) => stats.activityBreakdown?.[t] || 0),
      backgroundColor: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#64748b'],
      borderRadius: 6,
    }],
  };

  const statCards = [
    { icon: TrendingUp, label: 'Performance Score', value: Math.round(student?.performanceScore || 0), unit: '/100', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { icon: Calendar, label: 'Attendance', value: Math.round(student?.attendancePercentage || 0), unit: '%', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: Award, label: 'Certificates', value: stats.approvedCertificates || 0, unit: ' approved', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: Zap, label: 'Activities', value: stats.totalActivities || 0, unit: ' total', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  ];

  return (
    <div className="page-layout">
      <div className="page-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="page-title">
            Hello, <span className="gradient-text">{student?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">
            {student?.department} • Batch {student?.batch} • {student?.enrollmentNumber}
          </p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map(({ icon: Icon, label, value, unit, color, bg }, i) => (
          <motion.div
            key={label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="stat-icon" style={{ background: bg, color }}>
              <Icon size={22} />
            </div>
            <div className="stat-value" style={{ color }}>{value}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{unit}</span></div>
            <div className="stat-label">{label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 24 }}>
        {/* Score Ring */}
        <motion.div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, alignSelf: 'flex-start' }}>
            Performance Score
          </h3>
          <ScoreRing score={student?.performanceScore || 0} size={200} />
          <div style={{ marginTop: 20, width: '100%' }}>
            {[
              { label: 'Attendance (30%)', value: (student?.attendancePercentage || 0) * 0.3, color: '#10b981' },
              { label: 'Certificates (30%)', value: Math.min((stats.approvedCertificates || 0) * 10, 30), color: '#f59e0b' },
              { label: 'Activities (40%)', value: Math.min((stats.totalActivities || 0) * 5, 40), color: '#7c3aed' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-muted)' }}>
                  <span>{label}</span><span style={{ color, fontWeight: 600 }}>{Math.round(value)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${Math.min(value, 40)}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Chart */}
        <motion.div className="glass-card" style={{ padding: 28 }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Activity Breakdown</h3>
          <div style={{ height: 240 }}>
            <Bar data={activityData} options={chartDefaults} />
          </div>
        </motion.div>
      </div>

      {/* Recent Certificates */}
      <motion.div className="glass-card" style={{ padding: 24 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Certificates</h3>
        {certificates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            <Award size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No certificates uploaded yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {certificates.slice(0, 5).map((cert) => (
              <div key={cert._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-secondary)',
                borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cert.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cert.issuedBy}</div>
                </div>
                <span className={`badge badge-${cert.verified}`}>
                  {cert.verified === 'approved' ? '✓' : cert.verified === 'rejected' ? '✗' : '⏳'}
                  {cert.verified}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
