import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login, clearError } from '../../features/auth/authSlice';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.passwordChanged && user.role === 'student') {
        navigate('/change-password');
      } else {
        let path = '/dashboard';
        if (user.role === 'student') {
          path = user.isSuper50 ? '/dashboard' : '/placement';
        } else if (user.role === 'teacher') {
          path = '/teacher/dashboard';
        } else if (user.role === 'admin') {
          path = '/leaderboard';
        } else if (user.role === 'guide') {
          path = '/pms/guide';
        }
        navigate(path);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
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
        position: 'absolute', top: '20%', left: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 40px rgba(124,58,237,0.4)',
            }}
          >
            <GraduationCap size={36} color="white" />
          </motion.div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '0.1em', marginBottom: 8 }}>
            <span className="gradient-text">MILE</span><span style={{ color: '#7c3aed' }}>.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            Monitoring Individual Learning & Excellence
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Welcome back 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit}>
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
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  id="login-email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-black/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 28 }}>
              <button
                type="submit"
                className="btn-premium"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 24px', fontSize: 15 }}
                disabled={loading}
                id="login-submit"
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
                ) : 'Sign In →'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Register as Faculty
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          Students should contact admin for account creation
        </p>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
