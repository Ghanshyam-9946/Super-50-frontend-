import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, MessageSquare, AlertCircle, HelpCircle } from 'lucide-react';
import { fetchDriveFeedbacks } from '../features/placement/placementSlice';

const DriveFeedbacksModal = ({ isOpen, onClose, drive }) => {
  const dispatch = useDispatch();
  const feedbacks = useSelector((state) => (drive ? state.placement.driveFeedbacks[drive._id] || [] : []));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && drive?._id) {
      setLoading(true);
      dispatch(fetchDriveFeedbacks(drive._id)).finally(() => setLoading(false));
    }
  }, [isOpen, drive?._id, dispatch]);

  if (!isOpen || !drive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-2xl bg-[var(--bg-modal)] rounded-3xl border border-[var(--border-light)] shadow-[var(--shadow-elevated)] overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-light)] flex items-center justify-between bg-[var(--bg-card)]">
            <div>
              <h3 className="text-xl font-display font-black text-[var(--text-primary)]">
                Reviews & Experiences
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                Shared by students for <span className="text-[var(--primary)] font-bold">{drive.companyName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Fetching interview reviews...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="py-16 text-center bg-[var(--bg-app)] rounded-2xl border border-[var(--border-light)] border-dashed">
                <MessageSquare size={48} className="mx-auto mb-4 text-[#CBD5E1]" />
                <h4 className="text-base font-bold text-[var(--text-primary)]">No Feedbacks Yet</h4>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-2 max-w-xs mx-auto">
                  Be the first to share your interview experience if you participated in this drive!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {feedbacks.map((f) => (
                  <div key={f._id} className="glass-card p-6 border-[var(--border-light)] space-y-4">
                    {/* Student Info & Metadata */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-light)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-light)]">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[var(--text-primary)]">
                            {f.student?.name}
                          </h4>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mt-0.5">
                            {f.student?.department} • {f.student?.batch}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Difficulty */}
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          f.difficultyLevel === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          f.difficultyLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {f.difficultyLevel}
                        </span>

                        {/* Outcome */}
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-light)] text-[10px] font-bold">
                          {f.statusAtDrive}
                        </span>
                      </div>
                    </div>

                    {/* Review text */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                        Interview Process & Preparation
                      </h5>
                      <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--bg-app)] p-4 rounded-2xl border border-[var(--border-light)] whitespace-pre-line">
                        {f.experience}
                      </p>
                    </div>

                    {/* Questions */}
                    {f.interviewQuestions && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <HelpCircle size={12} /> Questions Faced
                        </h5>
                        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed bg-purple-500/5 p-4 rounded-2xl border border-purple-500/10 whitespace-pre-line">
                          {f.interviewQuestions}
                        </p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-medium opacity-60 justify-end">
                      <Calendar size={12} />
                      <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border-light)] bg-[var(--bg-card)] flex justify-end">
            <button
              onClick={onClose}
              className="btn-premium px-6 py-3 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DriveFeedbacksModal;
