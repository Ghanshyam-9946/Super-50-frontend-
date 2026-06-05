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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ width: '90%', maxWidth: 480, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Add Student</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Account will be created and credentials emailed automatically</p>
        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'e.g., Priya Sharma' },
            { key: 'enrollmentNumber', label: 'Enrollment Number *', placeholder: 'e.g., 0201CS221001' },
            { key: 'email', label: 'Email Address *', placeholder: 'student@college.edu', type: 'email' },
            { key: 'department', label: 'Department *', placeholder: 'e.g., Computer Science' },
            { key: 'batch', label: 'Batch *', placeholder: 'e.g., 2023-27' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{label}</label>
              <input className="input-field" type={type} value={form[key]} placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} required id={`add-student-${key}`} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading} id="add-student-submit">
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><UserPlus size={16} /> Create Account & Send Email</>}
          </button>
        </form>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    ? (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)
    : null;

  return (
    <div className="page-layout">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">All Students</h1>
          <p className="page-subtitle">{total} Super 50 students enrolled</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowAddModal(true)} id="add-student-btn">
            <UserPlus size={16} /> Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: 36 }} placeholder="Search students..."
            value={search} onChange={(e) => setSearch(e.target.value)} id="students-search" />
        </div>
        <select className="select-field" style={{ minWidth: 160 }} value={dept} onChange={(e) => setDept(e.target.value)} id="students-dept-filter">
          <option value="">All Departments</option>
          {filters.departments?.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="select-field" style={{ minWidth: 130 }} value={batch} onChange={(e) => setBatch(e.target.value)} id="students-batch-filter">
          <option value="">All Batches</option>
          {filters.batches?.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <motion.div className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 0, overflow: 'hidden' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th onClick={() => handleSort('attendancePercentage')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Attendance <SortIcon field="attendancePercentage" /></span>
                  </th>
                  <th onClick={() => handleSort('performanceScore')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Score <SortIcon field="performanceScore" /></span>
                  </th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((student, i) => (
                  <motion.tr key={student._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${(student.name.charCodeAt(0) * 37) % 360}, 60%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{student.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{student.enrollmentNumber} • {student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{student.department}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{student.batch}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--bg-secondary)', borderRadius: 3, minWidth: 50 }}>
                          <div style={{ height: '100%', width: `${student.attendancePercentage}%`, background: student.attendancePercentage >= 75 ? 'var(--success)' : student.attendancePercentage >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{Math.round(student.attendancePercentage)}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 18, fontWeight: 900, color: student.performanceScore >= 75 ? '#10b981' : student.performanceScore >= 50 ? '#7c3aed' : student.performanceScore >= 25 ? '#f59e0b' : '#ef4444' }}>
                        {Math.round(student.performanceScore)}
                      </span>
                    </td>
                    <td>
                      <span className={student.isActive ? 'badge badge-approved' : 'badge badge-rejected'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedStudentId(student._id)}
                          className="btn-outline-premium text-xs py-1 px-2 flex items-center gap-1"
                        >
                          <Eye size={14} /> Profile
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => dispatch(toggleStudentStatus(student._id)).then(r => !r.error && toast.success('Status updated'))}
                            className={student.isActive ? 'btn-danger' : 'btn-success'}
                            style={{ fontSize: 12, padding: '5px 12px' }} id={`toggle-${student._id}`}>
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
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Users size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <p style={{ color: 'var(--text-muted)' }}>No students found</p>
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
