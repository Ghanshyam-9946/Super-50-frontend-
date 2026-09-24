import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { UserPlus, Upload, FileSpreadsheet, FileText, Check, X, Loader2, Info, RefreshCw, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

function AddFacultyModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '', roles: 'teacher', responsibilities: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        faculty: [{
          name: form.name,
          email: form.email,
          department: form.department,
          roles: form.roles.split(',').map(r => r.trim()).filter(Boolean),
          responsibilities: form.responsibilities.split(',').map(r => r.trim()).filter(Boolean)
        }]
      };
      const { data } = await api.post('/admin/faculty/bulk-create', payload);
      setLoading(false);
      if (data.success) {
        toast.success('Faculty member created successfully!');
        onClose();
      } else {
        toast.error(data.message || 'Failed to create');
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Error occurred');
    }
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
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Add Faculty Manually</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Account will be created and welcome email sent</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'e.g., Prof. Rajesh Kumar' },
            { key: 'email', label: 'Email Address *', placeholder: 'faculty@college.edu', type: 'email' },
            { key: 'department', label: 'Department *', placeholder: 'e.g., Computer Science' },
            { key: 'roles', label: 'Roles (comma separated) *', placeholder: 'teacher, admin, tp_admin' },
            { key: 'responsibilities', label: 'Responsibilities (comma separated)', placeholder: 'Class Coordinator, Exam Coordinator' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                type={type} 
                value={form[key]} 
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} 
                required={key !== 'responsibilities'} 
              />
            </div>
          ))}
          <button type="submit" className="btn-premium w-full py-3 mt-6 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><UserPlus size={16} /> Create Faculty Account</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function BulkCreateFacultyPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [resultData, setResultData] = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 20971520,
    onDrop: (accepted) => { setFile(accepted[0]); setPreviewData(null); setResultData(null); },
    multiple: false,
  });

  const handlePreview = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/admin/faculty/bulk-preview', fd);
      setLoading(false);
      if (data.success) {
        setPreviewData(data);
      } else {
        toast.error(data.message || 'Failed to preview');
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Error occurred during preview');
    }
  };

  const handleCreate = async () => {
    if (!previewData?.data) return;
    const newFaculty = previewData.data.filter((f) => !f.alreadyExists);
    if (newFaculty.length === 0) { toast.error('No new faculty to create'); return; }
    setCreating(true);
    try {
      const { data } = await api.post('/admin/faculty/bulk-create', { faculty: newFaculty });
      setCreating(false);
      if (data.success) {
        setResultData(data);
        toast.success(`Created ${data.data?.created?.length || 0} accounts!`);
      } else {
        toast.error(data.message || 'Failed to create faculty');
      }
    } catch (err) {
      setCreating(false);
      toast.error(err.response?.data?.message || 'Error occurred during creation');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setResultData(null);
  };

  const handleRemoveFromPreview = (index) => {
    if (previewData && previewData.data) {
      const updatedList = [...previewData.data];
      const removedItem = updatedList.splice(index, 1)[0];
      let newCount = previewData.newCount;
      let existingCount = previewData.existingCount;
      if (removedItem.alreadyExists) existingCount -= 1;
      else newCount -= 1;
      setPreviewData({
        ...previewData,
        data: updatedList,
        newCount,
        existingCount
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-[var(--primary)] border border-purple-500/20 shadow-sm shrink-0">
              <UserPlus size={32} />
            </div>
            Bulk Faculty Creation
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Upload Excel sheet to securely register multiple faculty & staff accounts at once.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <button className="btn-outline-premium flex items-center gap-2 px-6 py-3" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} /> Manual Register
          </button>
        </motion.div>
      </header>

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/20 shadow-sm rounded-2xl p-6 flex gap-4">
        <Info size={24} className="text-blue-500 shrink-0" />
        <div className="text-[13px] text-[var(--text-primary)] leading-relaxed font-medium">
          <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-500">Required Columns</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Name', 'Email', 'Department', 'Roles', 'Responsibilities'].map(col => (
              <code key={col} className="bg-[var(--bg-input)] px-2 py-0.5 rounded text-blue-500 font-bold border border-[var(--border-light)] shadow-sm">{col}</code>
            ))}
          </div>
          <p className="text-[var(--text-secondary)] mb-4">Faculty members will receive a welcome email with their password credentials to sign in.</p>
        </div>
      </motion.div>

      {/* Step 1: Upload */}
      {!previewData && !resultData && (
        <motion.div className="glass-card shadow-sm p-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center font-black text-[var(--text-secondary)] shadow-sm border border-[var(--border-light)] text-sm">1</div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Upload File</h3>
          </div>
          
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer mb-8 ${
              isDragActive ? 'border-[var(--primary)] bg-purple-500/5' : 'border-[var(--border-light)] hover:border-[var(--primary-light)] bg-[var(--bg-input)]/50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2 border border-purple-500/20 shadow-sm">
                  <FileSpreadsheet size={40} className="text-[var(--primary)] mx-auto" />
                </div>
                <p className="font-display font-black text-xl text-[var(--text-primary)]">{file.name}</p>
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB • Click to change</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center border border-[var(--border-light)] shadow-sm">
                    <FileSpreadsheet size={32} className="text-slate-400" />
                  </div>
                </div>
                <p className="text-[var(--text-primary)] font-display font-black text-xl">{isDragActive ? 'Drop here!' : 'Drag & drop Excel file'}</p>
                <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">.xlsx, .xls (max 20MB)</p>
              </div>
            )}
          </div>
          
          <button 
            className="btn-premium w-full py-4 text-[15px] flex items-center justify-center gap-2"
            onClick={handlePreview} disabled={loading || !file}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Parsing Document...</> : '🔍 Preview Faculty'}
          </button>
        </motion.div>
      )}

      {/* Step 2: Preview */}
      {previewData && !resultData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card p-6 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center font-black text-white shadow-sm text-sm">2</div>
              <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Review & Confirm</h3>
            </div>
            
            <div className="flex gap-3">
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {previewData.newCount} New
              </span>
              {previewData.existingCount > 0 && (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs px-3 py-1.5 rounded-lg uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> {previewData.existingCount} Existing (Skip)
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
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Roles</th>
                    <th className="px-6 py-4">Responsibilities</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {previewData.data?.map((f, i) => (
                    <motion.tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.5) }}>
                      <td className="px-6 py-4 text-slate-400 font-bold">{i + 1}</td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{f.name}</td>
                      <td className="px-6 py-4">{f.email}</td>
                      <td className="px-6 py-4 font-bold">{f.department}</td>
                      <td className="px-6 py-4">{f.roles?.join(', ')}</td>
                      <td className="px-6 py-4">{f.responsibilities?.join(', ')}</td>
                      <td className="px-6 py-4">
                        {f.alreadyExists ? (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                            Exists
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleRemoveFromPreview(i)} 
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="Remove from list">
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
              onClick={handleCreate} disabled={creating || previewData.newCount === 0}>
              {creating ? (
                <><Loader2 size={18} className="animate-spin" /> Creating accounts...</>
              ) : (
                <><Mail size={18} /> Create {previewData.newCount} Accounts & Send Emails</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Result */}
      {resultData && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card border-[2px] border-emerald-500/30 shadow-sm p-12 max-w-3xl mx-auto text-center bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[60px] pointer-events-none"></div>
          
          <div className="text-6xl mb-6 relative z-10 drop-shadow-md">🎉</div>
          <h2 className="text-3xl font-display font-black mb-3 text-[var(--text-primary)] relative z-10">Faculty Accounts Created Successfully!</h2>
          <p className="text-[var(--text-secondary)] font-medium text-[15px] mb-10 max-w-lg mx-auto relative z-10">{resultData.message}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
            {[
              { label: 'Created & Emailed', value: resultData.data?.created?.length, color: 'text-emerald-500', border: 'border-emerald-500/20' },
              { label: 'Skipped (Exists)', value: resultData.data?.skipped?.length, color: 'text-amber-500', border: 'border-amber-500/20' },
              { label: 'Failed', value: resultData.data?.failed?.length, color: 'text-red-500', border: 'border-red-500/20' },
            ].map(({ label, value, color, border }) => (
              <div key={label} className={`bg-[var(--bg-select)] border ${border} p-6 rounded-3xl shadow-sm`}>
                <div className={`text-5xl font-display font-black ${color} mb-2`}>{value || 0}</div>
                <div className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
          
          <button className="btn-premium py-4 px-8 flex items-center justify-center gap-2 mx-auto relative z-10 shadow-lg shadow-purple-500/20" onClick={handleReset}>
            <RefreshCw size={18} /> Create Another Batch
          </button>
        </motion.div>
      )}

      {showAddModal && <AddFacultyModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
