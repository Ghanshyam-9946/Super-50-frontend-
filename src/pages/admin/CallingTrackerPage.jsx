import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, PhoneCall, User, ClipboardList, Plus, UserCheck, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
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
  const [newRemark, setNewRemark] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

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

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!newRemark.trim() || !selectedStudent) return;

    setSubmittingRemark(true);
    try {
      const { data } = await api.post(`/admin/students/${selectedStudent._id}/remarks`, {
        text: newRemark.trim()
      });
      
      // Update selected student's remarks in the state
      const updatedRemarks = data.data.remarks;
      setSelectedStudent(prev => ({
        ...prev,
        remarks: updatedRemarks
      }));

      // Update in main students list
      setStudents(prev => prev.map(s => s._id === selectedStudent._id ? { ...s, remarks: updatedRemarks } : s));
      
      setNewRemark('');
      toast.success('Calling remark added successfully');
    } catch (err) {
      toast.error('Failed to add remark');
    } finally {
      setSubmittingRemark(false);
    }
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
            Student Calling by Guide
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Track student calling logs and communication remarks submitted by their dedicated mentors.</p>
        </div>
      </header>

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

                {/* Add Calling Log Form */}
                <form onSubmit={handleAddRemark} className="space-y-3 border-t pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Add New Calling Remark</span>
                  <textarea
                    rows="3"
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Type call notes or mentor observation..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner-sm"
                  />
                  <button
                    type="submit"
                    disabled={submittingRemark || !newRemark.trim()}
                    className="btn-premium w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl shadow-sm"
                  >
                    {submittingRemark ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Remark
                  </button>
                </form>

                {/* Timeline of Remarks */}
                <div className="space-y-4 border-t pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Remark Logs</span>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {selectedStudent.remarks && selectedStudent.remarks.length > 0 ? (
                      selectedStudent.remarks.slice().reverse().map((remark, idx) => (
                        <div key={remark._id || idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{remark.text}</p>
                          <div className="flex flex-col gap-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-200/50">
                            <span className="text-indigo-600">By: {remark.addedBy?.name || 'Admin'}</span>
                            <span>{new Date(remark.addedAt).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
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
