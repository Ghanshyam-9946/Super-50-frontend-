import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchAllStudents, toggleStudentStatus, createStudent } from '../../features/students/studentsSlice';
import { Search, Filter, UserPlus, X, Loader2, ChevronDown, ChevronUp, TrendingUp, Calendar, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentProfileModal from '../../components/StudentProfileModal';

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
        className="bg-white border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 480, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-50 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[var(--primary)] flex items-center justify-center border border-purple-100 mb-4 shadow-sm">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
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

export default function StudentsPage() {
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

  useEffect(() => {
    dispatch(fetchAllStudents({ department: dept || undefined, batch: batch || undefined, search: search || undefined, sort: `${sortDir === 'desc' ? '-' : ''}${sortField}` }));
  }, [dispatch, dept, batch, search, sortField, sortDir]);

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
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Student Directory</h1>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            className="w-full bg-white border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
            placeholder="Search students by name or enrollment..."
            value={search} onChange={(e) => setSearch(e.target.value)} id="students-search" 
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            className="bg-white border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-10 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all appearance-none shadow-sm cursor-pointer min-w-[180px]" 
            value={dept} onChange={(e) => setDept(e.target.value)} id="students-dept-filter"
          >
            <option value="">All Departments</option>
            {filters.departments?.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
             <ChevronDown size={14} />
          </div>
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            className="bg-white border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-10 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all appearance-none shadow-sm cursor-pointer min-w-[150px]" 
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
            {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-16" />)}
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
                    className="hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="px-6 py-4 text-slate-400 font-bold">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-slate-200 shadow-sm flex items-center justify-center font-black text-white text-sm" style={{ background: `hsl(${(student.name.charCodeAt(0) * 37) % 360}, 60%, 40%)` }}>
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
                        <div className="flex-1 h-2 bg-slate-100 rounded-full min-w-[60px] overflow-hidden border border-slate-200">
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
                        <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                          Super 50
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.isActive ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1 w-max">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1 w-max">
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
                            className={`text-xs py-1.5 px-3 rounded-lg font-black uppercase tracking-widest shadow-sm transition-all border flex items-center gap-1.5 ${student.isActive ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
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

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} />}
      <StudentProfileModal 
        isOpen={!!selectedStudentId} 
        onClose={() => setSelectedStudentId(null)} 
        studentId={selectedStudentId} 
      />
    </div>
  );
}
