import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchAdminStats, fetchAllStudents } from '../../features/students/studentsSlice';
import { fetchPendingCertificates } from '../../features/certificates/certificatesSlice';
import { fetchAttendanceHistory } from '../../features/attendance/attendanceSlice';
import ScoreRing from '../../components/ScoreRing';
import { Users, Award, TrendingUp, ClipboardList, ShieldCheck, Clock } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { adminStats, allStudents, loading } = useSelector((s) => s.students);
  const { pendingCertificates } = useSelector((s) => s.certificates);
  const { history } = useSelector((s) => s.attendance);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAllStudents());
    dispatch(fetchPendingCertificates());
    dispatch(fetchAttendanceHistory());
  }, [dispatch]);

  const isAdmin = user?.role === 'admin';

  const scoreDistribution = [0, 25, 50, 75].map((threshold, i, arr) => ({
    label: i === 3 ? '75-100' : `${threshold}-${arr[i + 1]}`,
    count: allStudents.filter((s) => s.performanceScore >= threshold && s.performanceScore < (arr[i + 1] || 101)).length,
  }));

  const barData = {
    labels: scoreDistribution.map((d) => d.label),
    datasets: [{
      label: 'Students',
      data: scoreDistribution.map((d) => d.count),
      backgroundColor: ['#ef4444', '#f59e0b', '#7c3aed', '#10b981'],
      borderRadius: 6,
    }],
  };

  const statCards = [
    { icon: Users, label: 'Total Students', value: adminStats?.totalStudents || 0, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { icon: TrendingUp, label: 'Avg Performance', value: `${Math.round(adminStats?.stats?.avgScore || 0)}`, unit: '/100', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: ClipboardList, label: 'Avg Attendance', value: `${Math.round(adminStats?.stats?.avgAttendance || 0)}`, unit: '%', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { icon: ShieldCheck, label: 'Pending Verifications', value: pendingCertificates.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div className="page-layout">
      <div className="page-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="page-title">
            {isAdmin ? '⚙️ Admin' : '👩‍🏫 Teacher'} Dashboard
          </h1>
          <p className="page-subtitle">Welcome back, {user?.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </motion.div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map(({ icon: Icon, label, value, unit, color, bg }, i) => (
          <motion.div key={label} className="stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="stat-icon" style={{ background: bg, color }}>
              <Icon size={22} />
            </div>
            <div className="stat-value" style={{ color }}>
              {value}<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
            <div className="stat-label">{label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Score Distribution Chart */}
        <motion.div className="glass-card" style={{ padding: 24 }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Score Distribution</h3>
          <div style={{ height: 200 }}>
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true },
              },
            }} />
          </div>
        </motion.div>

        {/* Top Students */}
        <motion.div className="glass-card" style={{ padding: 24 }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🏆 Top Performers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(adminStats?.topStudents || []).map((s, i) => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: ['#fbbf24','#94a3b8','#cd7c2f'][i] || 'var(--text-muted)', width: 20 }}>
                  #{i + 1}
                </span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(s.name.charCodeAt(0) * 37) % 360}, 60%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>
                  {s.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.department}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#7c3aed' }}>{Math.round(s.performanceScore)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pending Certificates Alert */}
      {pendingCertificates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
          <ShieldCheck size={24} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>
              {pendingCertificates.length} certificate{pendingCertificates.length > 1 ? 's' : ''} awaiting verification
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Review and approve/reject student certificates</div>
          </div>
        </motion.div>
      )}

      {/* Recent Attendance Uploads */}
      <motion.div className="glass-card" style={{ padding: 24 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Recent Attendance Uploads
        </h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No attendance uploads yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 5).map((h) => (
              <div key={h._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg-secondary)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.fileName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    by {h.uploadedBy?.name} • {new Date(h.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {h.processedCount} students updated
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
