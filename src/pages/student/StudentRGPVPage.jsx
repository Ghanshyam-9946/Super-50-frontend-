import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Loader2, ClipboardList, CheckCircle, TrendingUp, Grid, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StudentRGPVPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyResults();
  }, []);

  const fetchMyResults = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rgpv/my-result');
      setResults(data.data);
    } catch (error) {
      toast.error('Failed to load your RGPV results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-200 shadow-sm shrink-0">
              <Award size={32} />
            </div>
            My RGPV Marks
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">View your official RGPV university grades, semester SGPA, and cumulative CGPA records.</p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-xs font-bold uppercase tracking-wider">Syncing your grades...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-2 border-slate-200 max-w-xl mx-auto rounded-3xl">
          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ClipboardList size={36} className="text-slate-400 opacity-60" />
          </div>
          <h3 className="text-xl font-display font-black text-slate-900 mb-2">No RGPV Marks Uploaded</h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Your university exam marks sheets haven't been uploaded by the coordinator yet. Once uploaded, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {results.map((res, index) => (
            <motion.div
              key={res._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all p-6 md:p-8 space-y-6"
            >
              {/* Semester Title and SGPA / CGPA Summary */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-black text-slate-900">Semester {res.semester}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider inline-block ${
                    res.resultDecision === 'PASS' 
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}>
                    Result: {res.resultDecision}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-center shadow-inner-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Semester SGPA</span>
                    <span className="text-lg font-display font-black text-indigo-600">{res.sgpa?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-center shadow-inner-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Cumulative CGPA</span>
                    <span className="text-lg font-display font-black text-emerald-600">{res.cgpa?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Subject Grades Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <BookOpen size={14} /> Subject-wise Grades
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(res.grades || {}).map(([subject, grade]) => (
                    <div
                      key={subject}
                      className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center flex flex-col justify-between h-20 shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-slate-500 truncate block mb-2 px-1" title={subject}>
                        {subject}
                      </span>
                      <span className={`text-base font-black font-mono inline-block mx-auto px-2 py-0.5 rounded ${
                        ['A+', 'A', 'B+', 'B'].includes(grade) ? 'text-emerald-600 bg-emerald-100/40' :
                        ['C+', 'C'].includes(grade) ? 'text-blue-600 bg-blue-100/40' :
                        'text-rose-600 bg-rose-100/40'
                      }`}>
                        {grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
