import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Target, TrendingUp, Calendar, FileText, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PodAIMarksPage = () => {
  const [marks, setMarks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const { data } = await api.get('/podai/my-marks');
        setMarks(data.data?.marks || []);
        setAnalytics(data.data?.analytics || null);
      } catch (error) {
        toast.error('Failed to load Pod AI marks');
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
        <p className="text-[var(--text-secondary)] font-medium">Loading your marks...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center gap-6 glass-card p-8 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-500 border border-fuchsia-200 shadow-sm shrink-0">
          <Target size={32} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Pod AI Marks</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Track your performance across all Pod AI assessments.</p>
        </div>
      </header>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Tests Taken</div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{analytics.totalTests}</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Average Score</div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{analytics.averageMarks.toFixed(1)}</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
              <Award size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Highest Score</div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{analytics.highestMarks}</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Marks Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
        <div className="p-8 border-b border-[var(--border-light)]">
          <h2 className="text-xl font-display font-black text-[var(--text-primary)]">Assessment History</h2>
        </div>
        
        {marks.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">You haven't been graded on any Pod AI tests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-input)]/30 border-b border-[var(--border-light)]">
                  <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Test Name</th>
                  <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Date</th>
                  <th className="text-right px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {marks.map((mark, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-input)]/10 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-[14px] text-[var(--text-primary)]">{mark.testName}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)]">
                        <Calendar size={14} /> {new Date(mark.testDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-lg font-black text-sm bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100">
                        {mark.marks}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PodAIMarksPage;
