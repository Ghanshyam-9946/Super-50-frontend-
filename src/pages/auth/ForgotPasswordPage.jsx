import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { forgotPassword } from '../../features/auth/authSlice';
import { GraduationCap, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(resultAction)) {
      setSubmitted(true);
      toast.success('Reset link sent to your email');
    } else {
      toast.error(resultAction.payload || 'Failed to send reset link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/login" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6 hover:scale-105 transition-transform">
            <GraduationCap className="text-purple-500" size={32} />
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">Forgot Password?</h1>
          <p className="text-gray-500 mt-2">Enter your email and we'll send you a reset link.</p>
        </div>

        <div className="glass-card p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-premium py-4 text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link →'}
              </button>

              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-green-500" size={40} />
              </div>
              <h2 className="text-xl font-bold text-white">Check your inbox</h2>
              <p className="text-gray-400">We've sent a password reset link to <strong>{email}</strong>.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="btn-outline-premium w-full py-3 text-sm"
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
