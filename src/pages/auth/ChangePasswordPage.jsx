import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { changePassword, clearError } from '../../features/auth/authSlice';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ curr: false, new: false, confirm: false });

  useEffect(() => {
    if (user?.passwordChanged) {
      const paths = { student: '/dashboard', teacher: '/teacher/dashboard', admin: '/admin/dashboard' };
      navigate(paths[user.role] || '/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const result = await dispatch(changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }));
    if (!result.error) {
      toast.success('Password changed successfully!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '30%', left: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(124,58,237,0.4)',
          }}>
            <ShieldCheck size={30} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Set Your Password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Welcome, <strong style={{ color: 'var(--accent-light)' }}>{user?.name}</strong>!
            Please change your temporary password to continue.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13,
            color: 'var(--accent-light)',
          }}>
            🔐 For your security, you must set a new password before accessing the system.
          </div>

          <form onSubmit={handleSubmit}>
            {[
              { key: 'currentPassword', label: 'Temporary Password', showKey: 'curr', placeholder: 'Enter temporary password' },
              { key: 'newPassword', label: 'New Password', showKey: 'new', placeholder: 'Min. 6 characters' },
              { key: 'confirmPassword', label: 'Confirm New Password', showKey: 'confirm', placeholder: 'Re-enter new password' },
            ].map(({ key, label, showKey, placeholder }) => (
              <div key={key} style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={show[showKey] ? 'text' : 'password'}
                    className="input-field"
                    style={{ paddingLeft: 38, paddingRight: 40 }}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    id={`change-${key}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15, marginTop: 10 }}
              disabled={loading}
              id="change-password-submit"
            >
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : '🔒 Set New Password'}
            </button>
          </form>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
