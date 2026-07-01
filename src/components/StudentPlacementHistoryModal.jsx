import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CheckCircle, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function StudentPlacementHistoryModal({ isOpen, onClose, student }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      fetchHistory();
    }
  }, [isOpen, student]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/placement/admin/student-history/${student._id}`);
      setHistory(data.data || []);
    } catch (error) {
      toast.error('Failed to load placement history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              <img 
                src={student.profileImage || `https://ui-avatars.com/api/?name=${student.name}&background=random`} 
                alt={student.name}
                className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover" 
              />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">
                  <span>{student.enrollmentNumber}</span>
                  <span>•</span>
                  <span>{student.department}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-gray-900 to-black">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="font-bold text-sm tracking-widest uppercase">Loading History...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                <Building2 size={64} className="text-gray-600 grayscale" />
                <h3 className="text-xl font-bold text-slate-600">No Applications Found</h3>
                <p className="text-sm text-gray-600">This student hasn't applied to any drives yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((app) => (
                  <div key={app._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 border-slate-100 bg-slate-50 hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-400 transition-colors">
                            {app.drive?.companyName || 'Unknown Company'}
                          </h4>
                          <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span>Package: {app.drive?.package || 'N/A'}</span>
                            <span>•</span>
                            <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {app.status === 'selected' ? (
                          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <CheckCircle size={14} /> Selected
                          </span>
                        ) : app.status === 'rejected' ? (
                          <span className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <XCircle size={14} /> Rejected
                          </span>
                        ) : app.status === 'applied' ? (
                          <span className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> In Progress
                          </span>
                        ) : (
                          <span className="px-4 py-2 bg-gray-500/10 text-slate-500 border border-gray-500/20 rounded-xl text-xs font-black uppercase tracking-widest">
                            {app.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline of Rounds */}
                    {app.roundsProgress && app.roundsProgress.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100 relative">
                        <div className="absolute top-6 bottom-0 left-[21px] w-0.5 bg-slate-50" />
                        <div className="space-y-4">
                          {app.roundsProgress.map((round, idx) => (
                            <div key={idx} className="flex items-center gap-4 relative z-10">
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-4 border-gray-900 ${
                                round.status === 'cleared' ? 'bg-emerald-500 text-slate-900' :
                                round.status === 'eliminated' ? 'bg-rose-500 text-slate-900' :
                                'bg-slate-50 text-slate-600'
                              }`}>
                                {round.status === 'cleared' ? <CheckCircle size={18} /> :
                                 round.status === 'eliminated' ? <XCircle size={18} /> :
                                 <Clock size={18} />}
                              </div>
                              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    {round.roundName}
                                  </div>
                                  <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    round.status === 'cleared' ? 'text-emerald-500/70' :
                                    round.status === 'eliminated' ? 'text-rose-500/70' :
                                    'text-slate-600'
                                  }`}>
                                    {round.status}
                                  </div>
                                </div>
                                {idx < app.roundsProgress.length - 1 && (
                                  <ArrowRight size={16} className="text-gray-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
