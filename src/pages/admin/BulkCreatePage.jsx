import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { previewBulkStudents, bulkCreateStudents, clearBulkPreview, clearBulkResult, removeStudentFromPreview } from '../../features/attendance/attendanceSlice';
import { createStudent } from '../../features/students/studentsSlice';
import { UserPlus, Upload, FileSpreadsheet, FileText, Check, X, Loader2, Info, RefreshCw, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Add Student Manually</h2>
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

export default function BulkCreatePage() {
  const dispatch = useDispatch();
  const { bulkPreview, bulkResult, loading } = useSelector((s) => s.attendance);
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20971520,
    onDrop: (accepted) => { setFile(accepted[0]); dispatch(clearBulkPreview()); dispatch(clearBulkResult()); },
    multiple: false,
  });

  const handlePreview = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    const fd = new FormData();
    fd.append('file', file);
    const result = await dispatch(previewBulkStudents(fd));
    if (result.error) toast.error(result.payload);
  };

  const handleCreate = async () => {
    if (!bulkPreview?.data) return;
    const newStudents = bulkPreview.data.filter((s) => !s.alreadyExists);
    if (newStudents.length === 0) { toast.error('No new students to create'); return; }
    setCreating(true);
    const result = await dispatch(bulkCreateStudents(newStudents));
    setCreating(false);
    if (!result.error) toast.success(`Created ${result.payload.data?.created?.length || 0} accounts!`);
    else toast.error(result.payload);
  };

  const handleReset = () => {
    setFile(null);
    dispatch(clearBulkPreview());
    dispatch(clearBulkResult());
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-[var(--primary)] border border-purple-200 shadow-sm shrink-0">
              <UserPlus size={32} />
            </div>
            Bulk Student Creation
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Upload PDF or Excel to securely create multiple student accounts at once.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <button className="btn-outline-premium flex items-center gap-2 px-6 py-3" onClick={() => setShowAddModal(true)} id="add-single-student-btn">
            <UserPlus size={18} /> Manual Register
          </button>
        </motion.div>
      </header>

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 shadow-sm rounded-2xl p-6 flex gap-4">
        <Info size={24} className="text-blue-500 shrink-0" />
        <div className="text-[13px] text-blue-900 leading-relaxed font-medium">
          <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-600">Required Columns</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Name', 'EnrollmentNumber', 'Email', 'Department', 'Batch'].map(col => (
              <code key={col} className="bg-white px-2 py-0.5 rounded text-blue-700 font-bold border border-blue-100 shadow-sm">{col}</code>
            ))}
          </div>
          <p className="text-blue-800/80 mb-4">Each student will automatically receive a welcome email with their secure login credentials. They must change password on first login.</p>
          <div className="border-t border-blue-200/50 pt-4">
            <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-600">Sample Excel Format</p>
            <a 
              href="/upload/register.xlsx" 
              download="register.xlsx"
              className="inline-flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-4 py-2.5 rounded-xl shadow-sm transition-all font-bold text-sm"
            >
              <FileSpreadsheet size={18} />
              Download Sample Excel File
            </a>
          </div>
        </div>
      </motion.div>

      {/* Step 1: Upload */}
      {!bulkPreview && !bulkResult && (
        <motion.div className="glass-card shadow-sm p-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 shadow-sm border border-slate-200 text-sm">1</div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Upload File</h3>
          </div>
          
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer mb-8 ${
              isDragActive ? 'border-[var(--primary)] bg-purple-50/50' : 'border-slate-200 hover:border-[var(--primary-light)] bg-slate-50/30'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-2 border border-purple-100 shadow-sm">
                  {file.name.endsWith('.pdf') ? <FileText size={40} className="text-[var(--primary)] mx-auto" /> : <FileSpreadsheet size={40} className="text-[var(--primary)] mx-auto" />}
                </div>
                <p className="font-display font-black text-xl text-[var(--text-primary)]">{file.name}</p>
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB • Click to change</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                    <FileSpreadsheet size={32} className="text-slate-400" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                    <FileText size={32} className="text-slate-400" />
                  </div>
                </div>
                <p className="text-[var(--text-primary)] font-display font-black text-xl">{isDragActive ? 'Drop here!' : 'Drag & drop Excel or PDF'}</p>
                <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">.xlsx, .xls, .pdf (max 20MB)</p>
              </div>
            )}
          </div>
          
          <button 
            className="btn-premium w-full py-4 text-[15px] flex items-center justify-center gap-2"
            onClick={handlePreview} disabled={loading || !file} id="preview-bulk-btn">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Parsing Document...</> : '🔍 Preview Students'}
          </button>
        </motion.div>
      )}

      {/* Step 2: Preview */}
      {bulkPreview && !bulkResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card p-6 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center font-black text-white shadow-sm text-sm">2</div>
              <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Review & Confirm</h3>
            </div>
            
            <div className="flex gap-3">
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {bulkPreview.newCount} New
              </span>
              {bulkPreview.existingCount > 0 && (
                <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> {bulkPreview.existingCount} Existing (Skip)
                </span>
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
                <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Enrollment No.</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Batch</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {bulkPreview.data?.map((s, i) => (
                    <motion.tr key={i} className="hover:bg-slate-50 transition-colors"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.5) }}>
                      <td className="px-6 py-4 text-slate-400 font-bold">{i + 1}</td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{s.name}</td>
                      <td className="px-6 py-4 font-mono font-bold">{s.enrollmentNumber}</td>
                      <td className="px-6 py-4">{s.email}</td>
                      <td className="px-6 py-4 font-bold">{s.department}</td>
                      <td className="px-6 py-4 font-bold">{s.batch}</td>
                      <td className="px-6 py-4">
                        {s.alreadyExists ? (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                            Exists
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => dispatch(removeStudentFromPreview(i))} 
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove from list">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="btn-secondary py-4 px-6 flex items-center gap-2" onClick={handleReset}>
              <RefreshCw size={18} /> Start Over
            </button>
            <button className="btn-premium flex-1 py-4 text-[15px] flex items-center justify-center gap-2"
              onClick={handleCreate} disabled={creating || bulkPreview.newCount === 0} id="confirm-bulk-create">
              {creating ? (
                <><Loader2 size={18} className="animate-spin" /> Creating accounts...</>
              ) : (
                <><Mail size={18} /> Create {bulkPreview.newCount} Accounts & Send Emails</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Result */}
      {bulkResult && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card border-[2px] border-emerald-400 shadow-sm p-12 max-w-3xl mx-auto text-center bg-emerald-50/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[60px] pointer-events-none"></div>
          
          <div className="text-6xl mb-6 relative z-10 drop-shadow-md">🎉</div>
          <h2 className="text-3xl font-display font-black mb-3 text-[var(--text-primary)] relative z-10">Accounts Created Successfully!</h2>
          <p className="text-[var(--text-secondary)] font-medium text-[15px] mb-10 max-w-lg mx-auto relative z-10">{bulkResult.message}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
            {[
              { label: 'Created & Emailed', value: bulkResult.data?.created?.length, color: 'text-emerald-500', border: 'border-emerald-200' },
              { label: 'Skipped (Exists)', value: bulkResult.data?.skipped?.length, color: 'text-amber-500', border: 'border-amber-200' },
              { label: 'Failed', value: bulkResult.data?.failed?.length, color: 'text-red-500', border: 'border-red-200' },
            ].map(({ label, value, color, border }) => (
              <div key={label} className={`bg-white border ${border} p-6 rounded-3xl shadow-sm`}>
                <div className={`text-5xl font-display font-black ${color} mb-2`}>{value || 0}</div>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
          
          <button className="btn-premium py-4 px-8 flex items-center justify-center gap-2 mx-auto relative z-10 shadow-lg shadow-purple-500/20" onClick={handleReset} id="bulk-create-again">
            <RefreshCw size={18} /> Create Another Batch
          </button>
        </motion.div>
      )}

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
