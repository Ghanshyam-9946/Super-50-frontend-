import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Super50AttendanceHistoryModal({ isOpen, onClose, student }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student?._id) {
      fetchLogs();
    }
  }, [isOpen, student]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/super50/student/${student._id}`);
      setLogs(res.data.data);
    } catch (err) {
      toast.error('Failed to load class attendance logs');
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
          className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-light)] flex items-center justify-between bg-slate-50/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center border border-purple-500/20 shadow-sm shrink-0">
                <ClipboardList size={20} />
              </div>
              <div>
                <h3 className="text-lg font-display font-black text-[var(--text-primary)]">Class Attendance Log</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Lecture-by-lecture presence record</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-[var(--text-primary)] bg-[var(--bg-input)] rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="p-4 bg-[var(--bg-app)] border-b border-[var(--border-light)] flex justify-between items-center text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
            <div>Enrolled: Super 50 Cohort</div>
            <div className="flex items-center gap-2">
              Overall Percentage: 
              <span className="text-sm font-display font-black text-[var(--primary)]">
                {Math.round(student.attendancePercentage || 0)}%
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-secondary)]">
                <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
                <p className="text-[11px] font-black uppercase tracking-widest">Loading history list...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6">
                <ClipboardList size={36} className="text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="font-bold text-[var(--text-secondary)] text-sm">No lecture attendance sheets uploaded yet.</p>
              </div>
            ) : (
              <div className="border border-[var(--border-light)] rounded-2xl overflow-hidden bg-[var(--bg-card)] shadow-inner-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="text-[9px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
                      <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Class Topic</th>
                        <th className="p-4">Recorded By</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)] text-[var(--text-primary)]">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="p-4 font-bold">
                            {new Date(log.classDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-4 font-bold text-sm">{log.className}</td>
                          <td className="p-4 text-[var(--text-secondary)]">{log.uploadedBy}</td>
                          <td className="p-4 text-right">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              log.status === 'present' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
