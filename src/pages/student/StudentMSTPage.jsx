import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Loader2, FileText, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentMSTPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/mst/my-result');
      setResults(data.data || []);
    } catch (error) {
      toast.error('Failed to load MST results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Loading your MST report...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-200 shadow-sm mx-auto">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-black text-[var(--text-primary)]">No MST Results Yet</h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Your MST assessment results haven't been uploaded by the admin for your semester yet. Once uploaded, your subject-wise scores will appear here.
          </p>
        </div>
      </div>
    );
  }

  const activeResult = results[selectedResultIndex];
  const scores = activeResult?.scores || {};
  const scoreEntries = Object.entries(scores);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 rounded-3xl mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-200 shadow-sm shrink-0">
            <Award size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">MST Performance Report</h1>
            <p className="text-[var(--text-secondary)] text-xs font-semibold mt-1">Review your subject-wise assessment marks and feedback.</p>
          </div>
        </div>

        {/* Tab selection if student has multiple tests */}
        {results.length > 1 && (
          <div className="flex gap-2 bg-[var(--bg-app)] border border-[var(--border-light)] p-1 rounded-xl">
            {results.map((res, index) => (
              <button
                key={index}
                onClick={() => setSelectedResultIndex(index)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedResultIndex === index
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sem {res.semester}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Assessment Title</div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{activeResult.testName}</h3>
            </div>

            <hr className="border-[var(--border-light)]" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-[var(--bg-app)] border border-[var(--border-light)] p-3 rounded-xl">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Semester</div>
                <div className="text-base font-black text-[var(--text-primary)] mt-1">Sem {activeResult.semester}</div>
              </div>
              <div className="bg-[var(--bg-app)] border border-[var(--border-light)] p-3 rounded-xl">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Evaluated On</div>
                <div className="text-sm font-bold text-[var(--text-primary)] mt-1">{new Date(activeResult.testDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs text-indigo-900 leading-relaxed">
              <BookOpen size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Subject Breakdown:</span> This report covers subjects assigned to Semester {activeResult.semester}.
              </div>
            </div>
          </div>
        </div>

        {/* Scores Breakdown */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" /> Subject-wise Performance
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedResultIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {scoreEntries.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No subject scores available in this report.</p>
                ) : (
                  scoreEntries.map(([subject, score], idx) => {
                    const numericScore = Number(score);
                    const isTotal = subject.toLowerCase().includes('total');
                    
                    const testNameLower = (activeResult?.testName || '').toLowerCase();
                    let maxMarks = 100;
                    if (testNameLower.includes('mst-1') || testNameLower.includes('mst 1') || testNameLower.includes('mst1')) {
                      maxMarks = 28;
                    } else if (testNameLower.includes('mst-2') || testNameLower.includes('mst 2') || testNameLower.includes('mst2')) {
                      maxMarks = 42;
                    }
                    
                    const isIdKey = subject.toLowerCase().includes('id') || subject.toLowerCase().includes('enrollment') || subject.toLowerCase().includes('roll');
                    const isPercentage = !isTotal && !isIdKey && !isNaN(numericScore) && numericScore <= maxMarks && numericScore >= 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-[var(--text-primary)] capitalize flex items-center gap-2">
                            <ChevronRight size={14} className="text-indigo-500" />
                            {subject}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-4 min-w-[160px] justify-between sm:justify-end">
                          {isPercentage && (
                            <div className="w-24 bg-slate-100 h-2.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                              <div 
                                className="bg-indigo-500 h-full rounded-full" 
                                style={{ width: `${Math.min((numericScore / maxMarks) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                          <div className="text-right">
                            <span className="font-black text-lg text-[var(--text-primary)]">
                              {score}
                            </span>
                            {!isTotal && !isIdKey && !isNaN(numericScore) && (
                              <span className="text-[10px] text-[var(--text-secondary)] font-bold ml-1">/ {maxMarks}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMSTPage;
