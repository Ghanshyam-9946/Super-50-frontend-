import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Users, ArrowRight, ShieldCheck, CheckCircle, AlertCircle, Loader2, GraduationCap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../features/auth/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

interface StudentWard {
  _id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  batch: string;
  semester?: number;
  section?: string;
  profileImage?: string;
}

interface ParentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ParentLoginModal({ isOpen, onClose }: ParentLoginModalProps) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [multipleWards, setMultipleWards] = useState<StudentWard[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(val);
    if (errorMsg) setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent, selectedStudentId?: string) => {
    if (e) e.preventDefault();
    if (!mobile || mobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload: { mobile: string; studentId?: string } = { mobile };
      if (selectedStudentId) {
        payload.studentId = selectedStudentId;
      }

      const res = await api.post('/parents/login', payload);
      const data = res.data;

      if (data.multiple && !selectedStudentId) {
        setMultipleWards(data.students);
        setLoading(false);
        return;
      }

      if (data.token && data.user) {
        localStorage.setItem('super50_token', data.token);
        localStorage.setItem('super50_user', JSON.stringify(data.user));
        if (data.allStudents) {
          localStorage.setItem('parent_all_students', JSON.stringify(data.allStudents));
        }
        dispatch(updateUser(data.user));
        toast.success(`Welcome Parent! Viewing ${data.user.name}'s profile.`);
        onClose();
        navigate('/parent/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check the registered mobile number.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWard = (studentId: string) => {
    handleLoginSubmit(null as any, studentId);
  };

  const handleBackToNumber = () => {
    setMultipleWards(null);
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[var(--bg-modal)] border border-[var(--border-light)] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header Icon & Title */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center border border-purple-500/20 shadow-sm shrink-0">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-[var(--text-primary)]">
                  Parent Portal
                </h2>
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                Real-time verified student progress & records
              </p>
            </div>
          </div>

          {!multipleWards ? (
            /* Step 1: Enter Mobile Number */
            <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4">
              <div className="rounded-2xl bg-[var(--bg-input)] p-3.5 border border-[var(--border-light)] text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="text-[var(--primary)] shrink-0 mt-0.5" size={16} />
                <div>
                  Enter your <strong className="text-[var(--text-primary)]">Registered Parent Mobile Number</strong> to access your ward's verified academic dashboard.
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Parent Mobile Number *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-slate-400 font-bold text-xs select-none border-r border-[var(--border-light)] pr-2.5">
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    autoFocus
                    required
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 pl-16 pr-10 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400"
                  />
                  {mobile.length === 10 && (
                    <CheckCircle className="absolute right-3.5 text-emerald-500" size={18} />
                  )}
                </div>
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || mobile.length < 10}
                className="btn-premium w-full py-3 flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Mobile Number...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Parent Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Student or faculty?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/login');
                    }}
                    className="text-[var(--primary)] hover:underline font-bold"
                  >
                    Campus Portal Sign In
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Step 2: Multiple Students Registered - Pick Ward */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Select Ward / छात्र चुनें
                </span>
                <button
                  onClick={handleBackToNumber}
                  className="text-xs text-[var(--primary)] hover:underline font-bold"
                >
                  Change Number
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {multipleWards.map((w) => (
                  <button
                    key={w._id}
                    onClick={() => handleSelectWard(w._id)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)] hover:border-[var(--primary)]/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs border border-purple-500/20 overflow-hidden">
                        {w.profileImage ? (
                          <img src={w.profileImage} alt={w.name} className="h-full w-full object-cover" />
                        ) : (
                          <GraduationCap size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {w.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            w.campus === 'ratibad'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                          }`}>
                            {w.campus === 'ratibad' ? 'Ratibad' : 'Gandhinagar'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {w.enrollmentNumber} • {w.department} ({w.batch})
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--primary)] py-2 font-bold">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading dashboard...</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
