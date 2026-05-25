import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentPlacementStatus, clearPlacementError } from '../../features/placement/placementSlice';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, XCircle, Clock, ChevronRight, Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentPlacementDashboard = () => {
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
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading your placement journey...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold text-slate-900 tracking-tight"
          >
            Placement Dashboard
          </motion.h1>
          <p className="text-slate-500 mt-1">Track your job applications and recruitment progress.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {studentApplications.map((app) => (
          <motion.div
            key={app._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 overflow-hidden relative group"
          >
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 blur-3xl opacity-10 rounded-full ${app.finalResult === 'selected' ? 'bg-green-500' : 'bg-purple-500'}`}></div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:border-purple-500/50 transition-colors">
                  <Briefcase className="text-purple-400" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{app.drive?.companyName || 'Unknown Company'}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-purple-300 font-semibold">{app.drive?.package || 'N/A'}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">Drive Deadline: {app.drive?.deadline ? new Date(app.drive.deadline).toLocaleDateString() : 'TBA'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                  app.status === 'eligible' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
                  app.status === 'not-eligible' ? 'bg-red-500/10 text-red-400 border-red-500/20 grayscale-[0.5]' :
                  app.status === 'selected' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {app.status === 'eligible' && <CheckCircle size={12} className="animate-pulse" />}
                  {app.status === 'not-eligible' && <XCircle size={12} />}
                  {app.status === 'selected' && <Award size={12} className="animate-bounce" />}
                  {app.status === 'not-eligible' ? 'Not Eligible' : app.status}
                </div>
                {app.finalResult === 'selected' && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-500 px-4 py-1.5 rounded-2xl text-[10px] font-black border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                    <Award size={14} /> HIRED
                  </div>
                )}
              </div>
            </div>

            {/* Timeline UI */}
            <div className="mt-8 space-y-6 relative z-10">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Recruitment Timeline</h4>
              
              <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                {app.roundsProgress?.map((round, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-[#030303] z-10 ${
                      round.status === 'cleared' ? 'bg-green-500' : 
                      round.status === 'eliminated' ? 'bg-red-500' : 'bg-gray-600'
                    }`}></div>
                    
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${
                        round.status === 'cleared' ? 'text-green-400' : 
                        round.status === 'eliminated' ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        {round.roundName}
                        {round.status === 'cleared' && <CheckCircle size={14} className="inline ml-2" />}
                        {round.status === 'eliminated' && <XCircle size={14} className="inline ml-2" />}
                      </span>
                      {round.feedback && <p className="text-xs text-slate-600 mt-1">{round.feedback}</p>}
                    </div>
                  </div>
                ))}

                {app.status === 'eligible' && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-[#030303] z-10 bg-purple-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-purple-400">Apply Now</span>
                    <p className="text-xs text-slate-600 mt-1">Application deadline: {app.drive?.deadline ? new Date(app.drive.deadline).toLocaleDateString() : 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>

            {app.status === 'eligible' && (
              <button className="mt-8 w-full btn-premium py-3 text-sm flex items-center justify-center gap-2">
                Register for Drive <ChevronRight size={18} />
              </button>
            )}
          </motion.div>
        ))}

        {!loading && studentApplications.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center"
          >
            <Clock className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900">No Active Drives</h3>
            <p className="text-slate-500 mt-2">Check back later for new placement opportunities.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentPlacementDashboard;
