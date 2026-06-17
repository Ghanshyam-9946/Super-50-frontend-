import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { submitFeedback } from '../features/placement/placementSlice';
import toast from 'react-hot-toast';

const FeedbackModal = ({ isOpen, onClose, drive }) => {
  const dispatch = useDispatch();
  const [experience, setExperience] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Medium');
  const [statusAtDrive, setStatusAtDrive] = useState('Selected');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !drive) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!experience.trim()) {
      toast.error('Please describe your placement/interview experience.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(submitFeedback({
        driveId: drive._id,
        experience,
        interviewQuestions,
        difficultyLevel,
        statusAtDrive,
        anonymous
      })).unwrap();
      
      toast.success('Thank you for sharing your experience!');
      onClose();
      // Reset form
      setExperience('');
      setInterviewQuestions('');
      setDifficultyLevel('Medium');
      setStatusAtDrive('Selected');
      setAnonymous(false);
    } catch (err) {
      toast.error(err || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const statuses = [
    'Selected',
    'Eliminated at HR Round',
    'Eliminated at Technical Interview',
    'Eliminated at Coding Round',
    'Eliminated at Aptitude Round',
    'Did not clear shortlist',
    'Other / Withdrew'
  ];

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
                Share Experience
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                Posting review for <span className="text-[var(--primary)] font-bold">{drive.companyName}</span> ({drive.package})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Experience / Overall Review */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                Overall Experience <span className="text-red-500">*</span>
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Describe the overall placement process, rounds, your preparation strategy, tips for other students, and what worked for you..."
                rows={4}
                className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-[var(--primary)] transition-all resize-none"
                required
              />
            </div>

            {/* Interview Questions */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                Interview Questions Faced <span className="text-[var(--text-secondary)] font-normal lowercase">(optional)</span>
              </label>
              <textarea
                value={interviewQuestions}
                onChange={(e) => setInterviewQuestions(e.target.value)}
                placeholder="List specific coding, technical, or HR questions you were asked during the interview rounds..."
                rows={3}
                className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-[var(--primary)] transition-all resize-none"
              />
            </div>

            {/* Difficulty Level & Recruitment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Difficulty Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Interview Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficultyLevel(diff)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all duration-300 ${
                        difficultyLevel === diff
                          ? diff === 'Easy'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                            : diff === 'Medium'
                            ? 'bg-amber-50 text-amber-600 border-amber-300'
                            : 'bg-red-50 text-red-600 border-red-300'
                          : 'bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Recruitment Outcome
                </label>
                <select
                  value={statusAtDrive}
                  onChange={(e) => setStatusAtDrive(e.target.value)}
                  className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-2xl p-3.5 text-sm font-medium focus:outline-none focus:border-[var(--primary)] transition-all"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="glass-card p-4 flex items-center justify-between border-[var(--border-light)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--primary)]">
                  {anonymous ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Post Anonymously</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                    Your name and enrollment number will be hidden from other students.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnonymous(!anonymous)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                  anonymous ? 'bg-[var(--primary)]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                    anonymous ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[var(--border-light)] bg-[var(--bg-card)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline-premium px-6 py-3 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-premium px-6 py-3 rounded-xl text-xs flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
              <Send size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackModal;
