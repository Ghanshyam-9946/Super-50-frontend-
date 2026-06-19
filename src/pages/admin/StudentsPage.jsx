import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchAllStudents, toggleStudentStatus, createStudent } from '../../features/students/studentsSlice';
import { Search, Filter, UserPlus, X, Loader2, ChevronDown, ChevronUp, TrendingUp, Calendar, Users, Eye, ClipboardList, Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentProfileModal from '../../components/StudentProfileModal';
import api from '../../services/api';

function AddStudentModal({ onClose }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', enrollmentNumber: '', email: '', department: '', batch: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await dispatch(createStudent(form));
    setLoading(false);
    if (!result.error) { toast.success('Student created & email sent!'); onClose(); }
    else toast.error(result.payload);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 480, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center border border-purple-500/20 mb-4 shadow-sm">
          <UserPlus size={24} />
        </div>
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Add Student</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Account will be created and credentials emailed automatically</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'e.g., Priya Sharma' },
            { key: 'enrollmentNumber', label: 'Enrollment Number *', placeholder: 'e.g., 0201CS221001' },
            { key: 'email', label: 'Email Address *', placeholder: 'student@college.edu', type: 'email' },
            { key: 'department', label: 'Department *', placeholder: 'e.g., Computer Science' },
            { key: 'batch', label: 'Batch *', placeholder: 'e.g., 2023-27' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                type={type} 
                value={form[key]} 
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} 
                required 
                id={`add-student-${key}`} 
              />
            </div>
          ))}
          <button type="submit" className="btn-premium w-full py-3 mt-6 flex items-center justify-center gap-2" disabled={loading} id="add-student-submit">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><UserPlus size={16} /> Create Account & Send Email</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Super50ClassAttendanceModal({ onClose, classId, onSuccess }) {
  const [className, setClassName] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().substring(0, 10));
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checklistSearch, setChecklistSearch] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const studentsRes = await api.get('/admin/students', { params: { isSuper50: 'true' } });
        const allSuper50 = studentsRes.data.data.filter(s => s.isActive);

        if (classId) {
          const classRes = await api.get(`/attendance/super50/class/${classId}`);
          const classData = classRes.data.data;
          setClassName(classData.className);
          setClassDate(new Date(classData.classDate).toISOString().substring(0, 10));

          const recordsMap = {};
          classData.records.forEach(r => {
            if (r.student) {
              recordsMap[r.student._id || r.student] = r.status;
            }
          });

          const merged = allSuper50.map(s => ({
            _id: s._id,
            name: s.name,
            enrollmentNumber: s.enrollmentNumber,
            status: recordsMap[s._id] || 'present'
          }));
          setStudents(merged);
        } else {
          const list = allSuper50.map(s => ({
            _id: s._id,
            name: s.name,
            enrollmentNumber: s.enrollmentNumber,
            status: 'present'
          }));
          setStudents(list);
        }
      } catch (err) {
        toast.error('Failed to load students list');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [classId]);

  const toggleStudentStatus = (id) => {
    setStudents(prev => prev.map(s => s._id === id 
      ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } 
      : s
    ));
  };

  const handleMarkAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!className.trim()) return toast.error('Class Name is required');

    setSubmitting(true);
    try {
      if (file && !classId) {
        const formData = new FormData();
        formData.append('className', className);
        formData.append('classDate', classDate);
        formData.append('file', file);

        await api.post('/attendance/super50/upload-excel', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Attendance sheet recorded successfully via Excel');
      } else {
        const records = students.map(s => ({
          studentId: s._id,
          status: s.status
        }));

        const body = { className, classDate, records };

        if (classId) {
          await api.put(`/attendance/super50/class/${classId}`, body);
          toast.success('Attendance record updated successfully');
        } else {
          await api.post('/attendance/super50', body);
          toast.success('Attendance sheet recorded successfully');
        }
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
    s.enrollmentNumber.toLowerCase().includes(checklistSearch.toLowerCase())
  );

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.length - presentCount;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative flex flex-col" style={{ width: '90%', maxWidth: 640, height: '80vh', padding: 32 }}>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors z-10">
          <X size={20} />
        </button>

        <div className="shrink-0 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center border border-purple-500/20 mb-4 shadow-sm">
            <ClipboardList size={24} />
          </div>
          <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">
            {classId ? 'Edit Class Attendance' : 'Record Class Attendance'}
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)] font-medium">Input date, topic, and mark present/absent for Super 50 students.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Class / Topic Name *</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                type="text" 
                value={className} 
                placeholder="e.g., DSA Lecture 1"
                onChange={(e) => setClassName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Class Date *</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm" 
                type="date" 
                value={classDate} 
                onChange={(e) => setClassDate(e.target.value)} 
                required 
              />
            </div>
          </div>

          {!classId && (
            <div className="border border-dashed border-[var(--border-light)] rounded-2xl p-4 bg-slate-50/5 flex flex-col items-center justify-center shrink-0">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center w-full">
                Or upload attendance via Excel (.xlsx, .xls)
              </label>
              <div className="flex items-center gap-3 w-full">
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden" 
                  id="super50-attendance-file"
                />
                <label 
                  htmlFor="super50-attendance-file"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] hover:border-[var(--primary)] rounded-xl py-2.5 px-4 text-[12px] font-bold text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all shadow-sm"
                >
                  {file ? `Selected: ${file.name}` : 'Choose Excel File'}
                </label>
                {file && (
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all border border-rose-500/20"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {file ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-purple-500/5 rounded-2xl border border-purple-500/20">
              <ClipboardList size={48} className="text-[var(--primary)] mb-4 animate-bounce" />
              <h4 className="font-display font-black text-sm text-[var(--text-primary)]">Excel Upload Mode Active</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                Attendance will be parsed from <strong>{file.name}</strong>. Manual checklist selections are ignored.
              </p>
              <button 
                type="button" 
                onClick={() => setFile(null)} 
                className="mt-4 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-all"
              >
                Switch to Manual Checklist
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 border border-[var(--border-light)] rounded-2xl p-4 bg-slate-50/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search students..."
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-1.5 pl-9 pr-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider shrink-0">
                  <button type="button" onClick={() => handleMarkAll('present')} className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg">Mark All Present</button>
                  <button type="button" onClick={() => handleMarkAll('absent')} className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg">Mark All Absent</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-1.5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Loading checklist...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-bold text-xs uppercase tracking-wider">No students found</div>
                ) : (
                  filteredStudents.map(student => (
                    <div 
                      key={student._id}
                      onClick={() => toggleStudentStatus(student._id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        student.status === 'present' 
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' 
                          : 'bg-rose-500/5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-[var(--text-primary)]">{student.name}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400 mt-0.5 tracking-wider">{student.enrollmentNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          student.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-light)] text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                <div>Total: {students.length} students</div>
                <div className="flex gap-3">
                  <span className="text-emerald-500">{presentCount} Present</span>
                  <span className="text-rose-500">{absentCount} Absent</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-premium w-full py-3.5 flex items-center justify-center gap-2 shrink-0" disabled={submitting}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><ClipboardList size={16} /> Save Attendance</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function StudentsPage({ isSuper50 = false }) {
  const dispatch = useDispatch();
  const { allStudents, filters, loading, total } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [batch, setBatch] = useState('');
  const [sortField, setSortField] = useState('performanceScore');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Super 50 Class Attendance States
  const [subTab, setSubTab] = useState('cohort');
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await api.get('/attendance/super50');
      setClasses(res.data.data);
    } catch (err) {
      toast.error('Failed to load class attendance logs');
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    if (isSuper50 && subTab === 'attendance') {
      fetchClasses();
    }
  }, [isSuper50, subTab]);

  const handleDeleteClass = async (id) => {
    if (window.confirm('Are you sure you want to delete this class attendance sheet? Student attendance percentages will be recalculated.')) {
      try {
        await api.delete(`/attendance/super50/class/${id}`);
        toast.success('Attendance record deleted');
        fetchClasses();
      } catch (err) {
        toast.error('Failed to delete attendance record');
      }
    }
  };

  useEffect(() => {
    dispatch(fetchAllStudents({ 
      department: dept || undefined, 
      batch: batch || undefined, 
      search: search || undefined, 
      sort: `${sortDir === 'desc' ? '-' : ''}${sortField}`,
      isSuper50: isSuper50 ? 'true' : undefined
    }));
  }, [dispatch, dept, batch, search, sortField, sortDir, isSuper50]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => sortField === field
    ? (sortDir === 'desc' ? <ChevronDown size={14} className="text-[var(--primary)]" /> : <ChevronUp size={14} className="text-[var(--primary)]" />)
    : <ChevronDown size={14} className="text-slate-300 opacity-50 group-hover:opacity-100" />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">{isSuper50 ? 'Super 50 Students' : 'Student Directory'}</h1>
          <p className="text-[var(--text-secondary)] font-medium">Manage {total} students, view profiles, and update status.</p>
        </motion.div>
        {user?.role === 'admin' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <button className="btn-premium flex items-center gap-2 px-6 py-3" onClick={() => setShowAddModal(true)} id="add-student-btn">
              <UserPlus size={18} /> Add Student
            </button>
          </motion.div>
        )}
      </header>

      {/* Super 50 Sub Tabs */}
      {isSuper50 && (
        <div className="flex border-b border-[var(--border-light)] gap-8">
          <button
            onClick={() => setSubTab('cohort')}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all relative ${
              subTab === 'cohort' ? 'text-[var(--primary)] font-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Cohort Directory
            {subTab === 'cohort' && (
              <motion.div layoutId="subtab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]" />
            )}
          </button>
          <button
            onClick={() => setSubTab('attendance')}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all relative ${
              subTab === 'attendance' ? 'text-[var(--primary)] font-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Class Attendance Sheets
            {subTab === 'attendance' && (
              <motion.div layoutId="subtab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]" />
            )}
          </button>
        </div>
      )}

      {(!isSuper50 || subTab === 'cohort') ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                placeholder="Search students by name or enrollment..."
                value={search} onChange={(e) => setSearch(e.target.value)} id="students-search" 
              />
            </div>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-10 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all appearance-none shadow-sm cursor-pointer min-w-[150px]" 
                value={batch} onChange={(e) => setBatch(e.target.value)} id="students-batch-filter"
              >
                <option value="">All Batches</option>
                {filters.batches?.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <motion.div className="glass-card overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {loading ? (
              <div className="p-6 flex flex-col gap-3">
                {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse bg-[var(--bg-hover)] rounded-xl h-16" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
                  <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Batch</th>
                      <th onClick={() => handleSort('attendancePercentage')} className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors group">
                        <span className="flex items-center gap-1.5">Attendance <SortIcon field="attendancePercentage" /></span>
                      </th>
                      <th onClick={() => handleSort('performanceScore')} className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors group">
                        <span className="flex items-center gap-1.5">Score <SortIcon field="performanceScore" /></span>
                      </th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {allStudents.map((student, i) => (
                      <motion.tr key={student._id}
                        className="hover:bg-[var(--bg-hover)] transition-colors"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                        <td className="px-6 py-4 text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full border border-[var(--border-light)] shadow-sm flex items-center justify-center font-black text-white text-sm" style={{ background: `hsl(${(student.name.charCodeAt(0) * 37) % 360}, 60%, 40%)` }}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[14px] text-[var(--text-primary)]">{student.name}</div>
                              <div className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-0.5 opacity-80">{student.enrollmentNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold">{student.department}</td>
                        <td className="px-6 py-4 font-bold">{student.batch}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full min-w-[60px] overflow-hidden border border-[var(--border-light)]">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${student.attendancePercentage}%`, background: student.attendancePercentage >= 75 ? '#10b981' : student.attendancePercentage >= 50 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span className="text-[11px] font-black text-[var(--text-primary)] min-w-[32px]">{Math.round(student.attendancePercentage)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xl font-display font-black" style={{ color: student.performanceScore >= 75 ? '#10b981' : student.performanceScore >= 50 ? '#7c3aed' : student.performanceScore >= 25 ? '#f59e0b' : '#ef4444' }}>
                            {Math.round(student.performanceScore)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {student.isSuper50 ? (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                              Super 50
                            </span>
                          ) : (
                            <span className="bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-light)] text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                              Regular
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.isActive ? (
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1 w-max">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                            </span>
                          ) : (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1 w-max">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedStudentId(student._id)}
                              className="btn-outline-premium text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                            >
                              <Eye size={14} /> Profile
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => dispatch(toggleStudentStatus(student._id)).then(r => !r.error && toast.success('Status updated'))}
                                className={`text-xs py-1.5 px-3 rounded-lg font-black uppercase tracking-widest shadow-sm transition-all border flex items-center gap-1.5 ${student.isActive ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                                id={`toggle-${student._id}`}
                              >
                                {student.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {allStudents.length === 0 && (
                  <div className="p-16 text-center border-t border-dashed">
                    <Users size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">No students found</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      ) : (
        <motion.div className="glass-card overflow-hidden p-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-light)]">
            <div>
              <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Class Attendance Sheets</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Record and track lecture-wise attendance logs for the Super 50 cohort.</p>
            </div>
            <button
              onClick={() => { setEditingClassId(null); setShowAttendanceModal(true); }}
              className="btn-premium flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-sm font-bold text-xs uppercase tracking-widest"
            >
              <Plus size={16} /> Record Attendance
            </button>
          </div>

          {loadingClasses ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 size={36} className="animate-spin text-[var(--primary)]" />
              <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Syncing class records...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="py-16 text-center border-dashed border-2 border-[var(--border-light)] rounded-2xl bg-slate-50/5 p-6 max-w-md mx-auto my-8">
              <ClipboardList size={40} className="text-slate-400 mx-auto mb-3 opacity-60" />
              <h4 className="text-sm font-black text-[var(--text-primary)]">No class logs recorded yet</h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Get started by creating your first lecture attendance sheet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
                <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Class / Session Title</th>
                    <th className="px-6 py-4">Enrolled Students</th>
                    <th className="px-6 py-4">Present</th>
                    <th className="px-6 py-4">Absent</th>
                    <th className="px-6 py-4">Recorded By</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {classes.map((cls) => (
                    <tr key={cls._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                        {new Date(cls.classDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)] text-[14px]">
                        {cls.className}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-bold">{cls.totalStudents} students</td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                          {cls.presentCount} Present
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                          {cls.absentCount} Absent
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-[var(--text-secondary)]">
                        {cls.uploadedBy?.name || 'Admin'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingClassId(cls._id); setShowAttendanceModal(true); }}
                            className="p-2 text-blue-500 hover:text-blue-700 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all shadow-sm"
                            title="Edit Attendance Sheet"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls._id)}
                            className="p-2 text-rose-500 hover:text-rose-700 bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all shadow-sm"
                            title="Delete Attendance Sheet"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} />}
      <StudentProfileModal 
        isOpen={!!selectedStudentId} 
        onClose={() => setSelectedStudentId(null)} 
        studentId={selectedStudentId} 
      />
      {showAttendanceModal && (
        <Super50ClassAttendanceModal 
          onClose={() => setShowAttendanceModal(false)} 
          classId={editingClassId} 
          onSuccess={fetchClasses} 
        />
      )}
    </div>
  );
}
