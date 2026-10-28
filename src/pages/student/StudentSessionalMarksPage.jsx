import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Loader2, AlertCircle, Lock } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

// Same names the faculty see when entering marks.
const CATEGORY_LABELS = { Assignment: "Assignment", Tutorial: "Tutorial", Activity: "Activity", LabRecord: "Lab Record" };
const activityName = (e) => (e.category === "Activity" && e.kind ? e.kind : CATEGORY_LABELS[e.category] || e.category);
const num = (v) => (v === null || v === undefined || v === "" ? "—" : Math.round(Number(v) * 100) / 100);

// Every mark the faculty entered for one subject: each activity (unit by
// unit), the two MST tests and the lab components — the pieces that make up
// the CA /10, MST /20 and lab totals above.
function MarksBreakdown({ sheet }) {
  const entries = [...(sheet.caEntries || [])].sort((a, b) =>
    activityName(a).localeCompare(activityName(b)) || (a.unit || 0) - (b.unit || 0));
  const unitWise = new Set(entries.filter((e) => (e.unit || 1) > 1).map(activityName));
  const caObtained = entries.reduce((s, e) => s + (Number(e.obtained) || 0), 0);
  const caMax = entries.reduce((s, e) => s + (Number(e.max) || 0), 0);
  const tests = [["MST 1", sheet.mst?.test1, 0], ["MST 2", sheet.mst?.test2, 2]].filter(([, t]) => t && t.max != null);
  // Question-wise MST marks by Course Outcome: A1/B1/C1 are the first CO of
  // the paper (CO1 in MST-1, CO3 in MST-2), and so on; A = 3, B = 4, C = 7 marks.
  const byCO = (t, offset) => {
    const out = {};
    Object.entries(t.parts || {}).forEach(([k, v]) => {
      const co = `CO${offset + Number(k.slice(1))}`;
      out[co] = out[co] || { got: 0, max: 0 };
      out[co].got += Number(v) || 0;
      out[co].max += { A: 3, B: 4, C: 7 }[k[0]] || 0;
    });
    return Object.entries(out).sort(([a], [b]) => a.localeCompare(b));
  };
  const lab = sheet.lab || {};
  // Marks by lab activity when the faculty uses lab activities; otherwise
  // the standard Attendance / Submission / Viva.
  const labEntries = sheet.labEntries || [];
  const labRows = labEntries.length
    ? labEntries.map((e) => [e.category, `${num(e.obtained)} / ${num(e.max)}`])
    : [["Attendance", num(lab.attendance)], ["Submission", num(lab.submission)], ["Viva", num(lab.viva)]];
  const hasLab = labEntries.length > 0 || ["attendance", "submission", "viva"].some((k) => lab[k] != null);

  const th = "px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]";
  const td = "px-3 py-2 text-sm text-[var(--text-primary)]";

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] border-t border-[var(--border-light)] pt-4">
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Continuous Assessment — activity-wise</div>
        {entries.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">No activity marks entered yet.</p>
        ) : (
          <div className="overflow-x-auto border border-[var(--border-light)] rounded-xl">
            <table className="w-full min-w-[320px]">
              <thead className="bg-[var(--bg-input)]/60 text-left">
                <tr><th className={th}>Activity</th><th className={`${th} text-right`}>Marks</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id} className="border-t border-[var(--border-light)]">
                    <td className={td}>
                      {activityName(e)}
                      {unitWise.has(activityName(e)) && <span className="text-[var(--text-secondary)]"> · Unit {e.unit}</span>}
                    </td>
                    <td className={`${td} text-right font-bold tabular-nums`}>{num(e.obtained)} / {num(e.max)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-light)] bg-[var(--bg-input)]/40">
                  <td className={`${td} font-bold`}>Total → scaled to 10</td>
                  <td className={`${td} text-right font-black tabular-nums`}>{num(caObtained)} / {num(caMax)} → {num(sheet.converted?.ca10)} / 10</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">MST</div>
          {tests.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">MST marks not available yet.</p>
          ) : (
            <div className="border border-[var(--border-light)] rounded-xl divide-y divide-[var(--border-light)]">
              {tests.map(([name, t, offset]) => (
                <div key={name} className="px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]">{t.testName || name}</span>
                    <span className="font-bold tabular-nums">{t.absent ? "Absent" : `${num(t.obtained)} / ${num(t.max)}`}</span>
                  </div>
                  {!t.absent && byCO(t, offset).length > 0 && (
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {byCO(t, offset).map(([co, v]) => `${co} ${num(v.got)}/${v.max}`).join(" · ")}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 text-sm bg-[var(--bg-input)]/40">
                <span className="font-bold">Scaled</span>
                <span className="font-black tabular-nums">{num(sheet.converted?.mst20)} / 20</span>
              </div>
            </div>
          )}
        </div>
        {hasLab && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Lab work</div>
            <div className="border border-[var(--border-light)] rounded-xl divide-y divide-[var(--border-light)]">
              {labRows.map(([name, v]) => (
                <div key={name} className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-[var(--text-primary)]">{name}</span>
                  <span className="font-bold tabular-nums">{v}</span>
                </div>
              ))}
              {sheet.converted?.labMarks != null && (
                <div className="flex justify-between px-3 py-2 text-sm bg-[var(--bg-input)]/40">
                  <span className="font-bold">Lab marks /20</span>
                  <span className="font-black tabular-nums">{num(sheet.converted.labMarks)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
            className="glass-card p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            </div>
            <MarksBreakdown sheet={sheet} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
