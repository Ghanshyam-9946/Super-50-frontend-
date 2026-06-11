import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentPlacementStatus, clearPlacementError } from '../../features/placement/placementSlice';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, XCircle, Clock, ChevronRight, Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentPlacementDashboard = ({ showOnlyResults = false }) => {
  const dispatch = useDispatch();
  const { studentApplications, loading, error } = useSelector((state) => state.placement);

  useEffect(() => {
    dispatch(fetchStudentPlacementStatus());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPlacementError());
    }
  }, [error, dispatch]);

  if (loading && studentApplications.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
      <p className="text-[var(--text-secondary)] font-medium">Loading your placement journey...</p>
    </div>
  );

  const displayedApps = showOnlyResults 
    ? studentApplications.filter(app => 
        app.status === 'selected' || 
        app.status === 'rejected' ||
        app.status === 'not-eligible' || 
        app.roundsProgress?.length > 0
      )
    : studentApplications;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            {showOnlyResults ? 'Drive Results' : 'Placement Dashboard'}
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Track your job applications and recruitment progress.</p>
        </motion.div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {displayedApps.map((app) => (
          <motion.div
            key={app._id}
            variants={itemVariants}
            className="glass-card p-8 overflow-hidden relative group"
          >
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[60px] opacity-20 rounded-full transition-all duration-700 group-hover:scale-110 ${app.finalResult === 'selected' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1rem] bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] group-hover:border-[var(--primary)] group-hover:shadow-sm transition-all duration-300">
                  <Briefcase className="text-[var(--primary)]" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-[var(--text-primary)]">{app.drive?.companyName || 'Unknown Company'}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[13px] font-medium">
                    <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md">{app.drive?.package || 'N/A'}</span>
                    <span className="text-[var(--text-secondary)] opacity-50">•</span>
                    <span className="text-[var(--text-secondary)]">Deadline: {app.drive?.deadline ? new Date(app.drive.deadline).toLocaleDateString() : 'TBA'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                  app.status === 'eligible' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  app.status === 'not-eligible' ? 'bg-red-50 text-red-600 border-red-200' :
                  app.status === 'selected' ? 'bg-purple-50 text-[var(--primary-dark)] border-purple-200 shadow-[0_4px_10px_rgba(139,92,246,0.1)]' :
                  'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {app.status === 'eligible' && <CheckCircle size={14} className="animate-pulse" />}
                  {app.status === 'not-eligible' && <XCircle size={14} />}
                  {app.status === 'selected' && <Award size={14} className="animate-bounce" />}
                  {app.status === 'not-eligible' ? 'Not Eligible' : app.status}
                </div>
                {app.finalResult === 'selected' && (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black border border-amber-500/30 shadow-md shadow-orange-500/20 mt-1">
                    <Award size={14} /> HIRED
                  </div>
                )}
              </div>
            </div>

            {/* Timeline UI */}
            <div className="mt-10 space-y-6 relative z-10">
              <h4 className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-80">Recruitment Timeline</h4>
              
              <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border-light)]">
                {app.roundsProgress?.map((round, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-[var(--bg-card)] z-10 ${
                      round.status === 'cleared' ? 'bg-emerald-500' : 
                      round.status === 'eliminated' ? 'bg-red-500' : 'bg-slate-300'
                    }`}></div>
                    
                    <div className="flex flex-col">
                      <span className={`text-[15px] font-bold ${
                        round.status === 'cleared' ? 'text-emerald-600' : 
                        round.status === 'eliminated' ? 'text-red-600' : 'text-[var(--text-secondary)]'
                      }`}>
                        {round.roundName}
                      </span>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {round.status === 'cleared' && <CheckCircle size={14} className="text-emerald-500" />}
                        {round.status === 'eliminated' && <XCircle size={14} className="text-red-500" />}
                        <span className={`text-[10px] uppercase tracking-widest font-black ${
                          round.status === 'cleared' ? 'text-emerald-600' : 
                          round.status === 'eliminated' ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {round.status === 'cleared' ? 'Shortlisted' : 
                           round.status === 'eliminated' ? 'Not Shortlisted' : 'Pending'}
                        </span>
                      </div>
                      {round.feedback && <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-2 bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-light)]">{round.feedback}</p>}
                    </div>
                  </div>
                ))}

                {app.status === 'eligible' && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-[var(--bg-card)] z-10 bg-[var(--primary)] animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                    <span className="text-[15px] font-bold text-[var(--primary-dark)]">Apply Now</span>
                    <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-1">Application deadline: {app.drive?.deadline ? new Date(app.drive.deadline).toLocaleDateString() : 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>

            {app.status === 'eligible' && (
              <button className="mt-10 w-full btn-premium py-4 rounded-xl text-[15px] flex items-center justify-center gap-2 group-hover:shadow-[0_8px_25px_rgba(139,92,246,0.3)] transition-all duration-300">
                Register for Drive <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </motion.div>
        ))}

        {!loading && displayedApps.length === 0 && (
          <motion.div 
            variants={itemVariants}
            className="col-span-full glass-card p-16 text-center"
          >
            <div className="w-20 h-20 bg-slate-50 border border-[var(--border-light)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Clock className="text-[#CBD5E1]" size={36} />
            </div>
            <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">{showOnlyResults ? "No Results Yet" : "No Active Drives"}</h3>
            <p className="text-[var(--text-secondary)] font-medium mt-3 max-w-md mx-auto">{showOnlyResults ? "You haven't received any results from placement drives yet." : "Check back later for new placement opportunities."}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentPlacementDashboard;
