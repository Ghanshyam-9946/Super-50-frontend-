import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Loader2, AlertCircle, Lock } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function StudentSessionalMarksPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/sessional-marks/student");
        setSheets(data.data || []);
      } catch {
        toast.error("Failed to load sessional marks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Loading your sessional marks...</p>
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-200 shadow-sm mx-auto">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-black text-[var(--text-primary)]">No Sessional Marks Yet</h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Your sessional marks sheet hasn't been created by your subject faculty yet. Once marks are entered, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center gap-4 glass-card p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-200 shadow-sm shrink-0">
          <GraduationCap size={28} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Sessional Marks</h1>
          <p className="text-[var(--text-secondary)] text-xs font-semibold mt-1">MST (/20) + Continuous Assessment (/10), out of 30 per subject.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {sheets.map((sheet, idx) => (
          <motion.div
            key={sheet._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h4 className="font-bold text-[var(--text-primary)]">{sheet.subjectName}</h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Sem {sheet.semester} / {sheet.section}
                {sheet.locked && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[var(--primary)]">
                    <Lock size={10} /> Final
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">MST</div>
                <div className="text-base font-black text-[var(--text-primary)]">{sheet.converted.mst20}/20</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">CA</div>
                <div className="text-base font-black text-[var(--text-primary)]">{sheet.converted.ca10}/10</div>
              </div>
              <div className="text-center bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-1.5">
                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Final</div>
                <div className="text-lg font-black text-indigo-600">{sheet.converted.final30}/30</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
