import { useState, useEffect } from 'react';
import RemarkForm, { RemarkCard } from '../../components/remarks/RemarkForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, PhoneCall, User, ClipboardList, UserCheck, MessageSquare, Calendar, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function CallingTrackerPage() {
  const [guides, setGuides] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guideSearch, setGuideSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // How much mentoring each faculty member has done. Shown on screen only —
  // the PDF is the student record, not a staff scorecard.
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });
  const [downloading, setDownloading] = useState(false);

  const loadSummary = async (r = range) => {
    try {
      const { data } = await api.get('/mentoring/summary', {
        params: { from: r.from || undefined, to: r.to || undefined },
      });
      setSummary(data);
    } catch {
      setSummary(null);
    }
  };

  useEffect(() => { loadSummary(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const downloadRecords = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/mentoring/report.pdf', {
        params: { scope: 'all', from: range.from || undefined, to: range.to || undefined },
        responseType: 'blob',
      });
      const named = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '')?.[1] || 'Mentoring-Records.pdf';
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = named;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast.success(`Downloaded ${named}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not build the report');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [guidesRes, studentsRes] = await Promise.all([
        api.get('/admin/guides'),
        api.get('/admin/students')
      ]);
      setGuides(guidesRes.data.data);
      setStudents(studentsRes.data.data);
    } catch (error) {
      toast.error('Failed to load calling tracker data');
    } finally {
      setLoading(false);
    }
  };

  // The form posts and hands back the student's full remark list; this
  // only has to put it where the page already keeps it.
  const onRemarkAdded = (updatedRemarks) => {
    setSelectedStudent((prev) => ({ ...prev, remarks: updatedRemarks }));
    setStudents((prev) => prev.map((s) => (
      s._id === selectedStudent._id ? { ...s, remarks: updatedRemarks } : s
    )));
  };

  // Filter guides
  const filteredGuides = guides.filter(g => 
    g.name?.toLowerCase().includes(guideSearch.toLowerCase()) ||
    g.email?.toLowerCase().includes(guideSearch.toLowerCase())
  );

  // Get students for selected guide
  const mentoredStudents = selectedGuide 
    ? students.filter(s => s.mentor?._id === selectedGuide._id)
    : [];

  const filteredStudents = mentoredStudents.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-200 shadow-sm shrink-0">
              <PhoneCall size={32} />
            </div>
            Mentoring System
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Every remark a mentor has recorded against their students, and how much mentoring each faculty member has done.</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            From
            <input type="date" value={range.from}
              onChange={(e) => { const r = { ...range, from: e.target.value }; setRange(r); loadSummary(r); }}
              className="mt-1 block bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            To
            <input type="date" value={range.to}
              onChange={(e) => { const r = { ...range, to: e.target.value }; setRange(r); loadSummary(r); }}
              className="mt-1 block bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <button onClick={downloadRecords} disabled={downloading}
            className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 disabled:opacity-50">
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Mentoring Records
          </button>
        </div>
      </header>

      {/* Who is doing the mentoring, and in which semesters. */}
      {summary?.data?.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Remarks by faculty</h2>
            <span className="text-xs text-[var(--text-secondary)]">
              {summary.totals.remarks} remark(s) · {summary.totals.faculty} faculty · {summary.totals.students} student(s)
              {range.from || range.to ? ' in the chosen dates' : ''}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {summary.data.map((f) => (
              <div key={f.facultyId} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">{f.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{f.students} student(s)</div>
                  </div>
                  <span className="text-2xl font-display font-black text-[var(--primary)] leading-none">{f.total}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {f.semesters.map((sm) => (
                    <span key={sm.semester}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                      Sem {sm.semester}: {sm.count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-3">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
          <p className="font-bold text-sm tracking-widest uppercase">Loading Mentor Tracks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Pane 1: Guides List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">1. Select Mentor</h3>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search mentors..."
                value={guideSearch}
                onChange={(e) => setGuideSearch(e.target.value)}
                className="w-full pl-12 bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner-sm"
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredGuides.map(guide => {
                const count = students.filter(s => s.mentor?._id === guide._id).length;
                const isSelected = selectedGuide?._id === guide._id;
                return (
                  <div
                    key={guide._id}
                    onClick={() => {
                      setSelectedGuide(guide);
                      setSelectedStudent(null);
                    }}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{guide.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{guide.email}</p>
                      {guide.responsibilities && guide.responsibilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {guide.responsibilities.slice(0, 2).map((r, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black px-2 py-1 rounded-lg">
                      {count} students
                    </span>
                  </div>
                );
              })}
              {filteredGuides.length === 0 && (
                <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-dashed">
                  No mentors found.
                </div>
              )}
            </div>
          </div>

          {/* Pane 2: Students List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">2. Assigned Students</h3>
            {selectedGuide ? (
              <>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search assigned students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-12 bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner-sm"
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredStudents.map(student => {
                    const isSelected = selectedStudent?._id === student._id;
                    const remarksCount = student.remarks?.length || 0;
                    return (
                      <div
                        key={student._id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-500/5 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{student.name}</h4>
                          <p className="text-[11px] font-mono text-slate-500 uppercase mt-0.5">{student.enrollmentNumber}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${remarksCount > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            {remarksCount} Remarks
                          </span>
                          <ChevronRight size={16} className="text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-dashed">
                      No students found for this mentor.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 h-[280px] flex flex-col justify-center items-center">
                <User size={32} className="mb-2 opacity-55" />
                <p className="text-xs font-bold uppercase tracking-wider">Select a mentor first</p>
              </div>
            )}
          </div>

          {/* Pane 3: Remarks and Bio Details (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">3. Remarks & Calling Logs</h3>
            {selectedStudent ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="font-display font-black text-slate-900 text-lg">{selectedStudent.name}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{selectedStudent.enrollmentNumber} • {selectedStudent.department}</p>
                </div>

                {/* The same form the TG fills in, so a remark written here
                    carries the same purpose and action taken and lands in
                    the same reports. */}
                <div className="border-t pt-4">
                  <RemarkForm
                    studentId={selectedStudent._id}
                    onAdded={onRemarkAdded}
                    title="Add New Calling Remark"
                  />
                </div>

                {/* Timeline of Remarks */}
                <div className="space-y-4 border-t pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Remark Logs</span>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {selectedStudent.remarks && selectedStudent.remarks.length > 0 ? (
                      selectedStudent.remarks.slice().reverse().map((remark, idx) => (
                        <RemarkCard key={remark._id || idx} remark={remark} />
                      ))
                    ) : (
                      <div className="text-center text-xs text-slate-400 py-6">
                        No calling logs found for this student.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 h-[280px] flex flex-col justify-center items-center">
                <MessageSquare size={32} className="mb-2 opacity-55" />
                <p className="text-xs font-bold uppercase tracking-wider">Select a student first</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
