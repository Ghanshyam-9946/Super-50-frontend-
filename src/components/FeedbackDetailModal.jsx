import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Briefcase, HelpCircle, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const FeedbackDetailModal = ({ isOpen, onClose, feedback }) => {
  if (!isOpen || !feedback) return null;

  const getDifficultyStyles = (level) => {
    switch (level) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Hard':
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Medium':
      default:
        return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
  };

  const isSelected = feedback.statusAtDrive?.toLowerCase().includes('selected');

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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] text-[var(--primary)]">
                <Briefcase size={22} />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-[var(--text-primary)]">
                  {feedback.drive?.companyName || 'Placement Drive'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
                  Package Offered: <span className="text-[var(--primary-dark)] dark:text-[var(--primary)] font-black">{feedback.drive?.package || 'N/A'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-4">
              {/* Difficulty Card */}
              <div className="glass p-4 rounded-2xl border-[var(--border-light)] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Difficulty Level</span>
                <div className="mt-2 flex">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getDifficultyStyles(feedback.difficultyLevel)}`}>
                    {feedback.difficultyLevel}
                  </span>
                </div>
              </div>

              {/* Status/Outcome Card */}
              <div className="glass p-4 rounded-2xl border-[var(--border-light)] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Recruitment Outcome</span>
                <div className="mt-2 flex">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border uppercase tracking-wider flex items-center gap-1 ${
                    isSelected 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                  }`}>
                    {isSelected ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {feedback.statusAtDrive}
                  </span>
                </div>
              </div>
            </div>

            {/* Experience text */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={14} className="text-[var(--primary)]" /> Interview Experience & Tips
              </h4>
              <div className="bg-[var(--bg-app)] p-5 rounded-2xl border border-[var(--border-light)] text-sm text-[var(--text-secondary)] font-medium leading-relaxed whitespace-pre-wrap">
                {feedback.experience}
              </div>
            </div>

            {/* Questions block */}
            {feedback.interviewQuestions && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <HelpCircle size={14} /> Questions Asked
                </h4>
                <div className="bg-purple-500/5 p-5 rounded-2xl border border-purple-500/15 text-sm text-[var(--text-secondary)] font-medium leading-relaxed whitespace-pre-wrap">
                  {feedback.interviewQuestions}
                </div>
              </div>
            )}
          </div>

          {/* Footer containing Reviewer Details */}
          <div className="p-6 border-t border-[var(--border-light)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] text-[var(--text-secondary)]">
                <User size={18} />
              </div>
              <div>
                <span className="text-sm font-black text-[var(--text-primary)] block">
                  {feedback.student?.name}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-bold block uppercase tracking-wider mt-0.5">
                  {feedback.student?.department} • Batch {feedback.student?.batch}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-medium opacity-70">
              <Calendar size={13} />
              <span>Shared on {new Date(feedback.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackDetailModal;
