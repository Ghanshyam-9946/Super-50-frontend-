import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register, sendRegisterOtp, clearError } from '../../features/auth/authSlice';
import { GraduationCap, Mail, Lock, User, Building, Loader2, ArrowLeft, Key, RefreshCw, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'teacher', // default to teacher
  });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) {
      const paths = { student: '/dashboard', teacher: '/teacher/dashboard', admin: '/admin/dashboard' };
      navigate(paths[user.role] || '/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(sendRegisterOtp({ name: form.name, email: form.email }));
    if (sendRegisterOtp.fulfilled.match(resultAction)) {
      toast.success('OTP sent to your email! Valid for 30 seconds.');
      setStep(2);
      startCountdown();
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const resultAction = await dispatch(sendRegisterOtp({ name: form.name, email: form.email }));
      if (sendRegisterOtp.fulfilled.match(resultAction)) {
        toast.success('New OTP sent! Valid for 30 seconds.');
        setOtp('');
        startCountdown();
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(register({ ...form, otp }));
    if (register.fulfilled.match(resultAction)) {
      if (resultAction.payload.pendingVerification) {
        toast.success(resultAction.payload.message || 'Registration successful. Waiting for admin approval.');
        navigate('/login');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '10%', right: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 460, padding: '24px' }}
      >
        <Link to="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: 14,
          marginBottom: 24,
          fontWeight: 500,
          transition: 'color 0.2s'
        }} className="hover-primary">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(124,58,237,0.3)',
          }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Faculty & Guide Registration
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Create your account to manage students and tracking
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  style={{ paddingLeft: 40 }}
                  placeholder="Dr. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  style={{ paddingLeft: 40 }}
                  placeholder="faculty@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Department
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none"
                  style={{ paddingLeft: 40, appearance: 'none' }}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Registration Role
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none"
                  style={{ paddingLeft: 40, appearance: 'none' }}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                >
                  <option value="teacher">Teacher / Faculty</option>
                  <option value="guide">Project Guide</option>
                  <option value="pms_admin">PMS Admin</option>
                  <option value="super50_admin">Super 50 Admin</option>
                  <option value="tp_admin">Training & Placement Admin</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  style={{ paddingLeft: 40 }}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</>
              ) : 'Continue to Verification →'}
            </button>
          </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  We've sent a 6-digit OTP to <strong>{form.email}</strong>. Please enter it below.
                </p>
              </div>

              {/* OTP */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  One-Time Password (OTP)
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors text-center tracking-[0.5em]"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {/* Countdown Timer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                padding: '10px 14px',
                borderRadius: 10,
                background: countdown > 0 ? 'rgba(124,58,237,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${countdown > 0 ? 'rgba(124,58,237,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Timer size={15} style={{ color: countdown > 0 && countdown > 5 ? '#7c3aed' : '#ef4444' }} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: countdown > 5 ? '#a78bfa' : '#f87171',
                    transition: 'color 0.3s',
                  }}>
                    {countdown > 0 ? `OTP expires in ${countdown}s` : 'OTP expired!'}
                  </span>
                </div>
                {/* Resend Button */}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resendLoading || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: countdown > 0 || resendLoading || loading ? 'not-allowed' : 'pointer',
                    background: countdown > 0 || resendLoading || loading
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: countdown > 0 || resendLoading || loading ? 'var(--text-muted)' : 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  {resendLoading ? (
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                disabled={loading || otp.length < 6}
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</>
                ) : 'Complete Registration →'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full mt-4 bg-transparent border border-slate-700 text-white font-medium py-3 rounded-xl transition-all duration-200 hover:bg-white/5"
                disabled={loading}
              >
                Back to Details
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hover-primary:hover { color: var(--primary) !important; }
      `}</style>
    </div>
  );
}
