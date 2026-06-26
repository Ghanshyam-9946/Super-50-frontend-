import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, FileText, CheckCircle2, XCircle, Database } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PodAIMarksSheetPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ tests: [], students: [] });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMarksSheet();
  }, []);

  const fetchMarksSheet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/podai/marks-sheet');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load marks sheet');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = data.students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header section */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20 shadow-sm">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
                Pod AI Master Sheet
              </h1>
              <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
                View uploaded test marks for all students across the cohort.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative min-w-[300px]"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or enrollment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
          />
        </motion.div>
      </header>

      {/* Main Content */}
      <motion.div
        className="glass-card rounded-3xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-4">
            <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
            <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] animate-pulse">
              Generating Master Sheet...
            </p>
          </div>
        ) : data.tests.length === 0 ? (
          <div className="p-24 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-500/10 rounded-full flex items-center justify-center mb-6">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">No Test Marks Found</h3>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium mt-2 max-w-sm">
              No Pod AI marks have been uploaded yet. Once tests are uploaded, they will appear as columns here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full custom-scrollbar pb-2">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[var(--bg-app)]">
                  <th className="sticky left-0 z-20 bg-[var(--bg-app)] px-6 py-4 border-r border-[var(--border-light)] shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[280px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student Details</span>
                  </th>
                  {data.tests.map((testName, i) => (
                    <th key={i} className="px-6 py-4 border-r border-[var(--border-light)] min-w-[140px] text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{testName}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center min-w-[120px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Marks</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={data.tests.length + 2} className="p-12 text-center text-[13px] font-bold text-slate-400 uppercase tracking-wider">
                      No students match your search
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, i) => {
                    let totalMarks = 0;
                    
                    return (
                      <tr key={student._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="sticky left-0 z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg-hover)] px-6 py-3.5 border-r border-[var(--border-light)] shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-[13px] text-[var(--text-primary)]">{student.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {student.enrollmentNumber}
                              </span>
                              {student.isSuper50 ? (
                                <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-wider">S50</span>
                              ) : (
                                <span className="text-[8px] font-black bg-slate-500/10 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Reg</span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {data.tests.map((testName, j) => {
                          const marks = student.marks[testName];
                          const hasMarks = marks !== undefined && marks !== null;
                          if (hasMarks) totalMarks += marks;

                          return (
                            <td key={j} className="px-6 py-3.5 border-r border-[var(--border-light)] text-center">
                              {hasMarks ? (
                                <div className="flex items-center justify-center gap-1.5 text-emerald-500">
                                  <span className="font-display font-black text-[15px]">{marks}</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <span className="text-[10px] font-black text-rose-500/60 bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                                    <XCircle size={10} /> Absent
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        
                        <td className="px-6 py-3.5 text-center">
                          <div className="inline-flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] font-display font-black text-sm px-3 py-1 rounded-lg border border-[var(--primary)]/20 shadow-sm min-w-[4rem]">
                            {totalMarks}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && data.tests.length > 0 && (
          <div className="p-4 border-t border-[var(--border-light)] bg-[var(--bg-app)] flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{filteredStudents.length} Students Listed</span>
            <span>{data.tests.length} Tests Uploaded</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
