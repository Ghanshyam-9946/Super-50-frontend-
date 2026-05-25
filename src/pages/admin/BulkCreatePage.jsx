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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ width: '90%', maxWidth: 480, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Add Student Manually</h2>
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
    <div className="page-layout">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">
            <UserPlus size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10, color: '#7c3aed' }} />
            Bulk Student Creation
          </h1>
          <p className="page-subtitle">Upload PDF or Excel to create multiple student accounts at once</p>
        </div>
        <button className="btn-secondary" onClick={() => setShowAddModal(true)} id="add-single-student-btn">
          <UserPlus size={16} /> Manual Register
        </button>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12 }}>
        <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Required columns:</strong>&nbsp;
          {['Name', 'EnrollmentNumber', 'Email', 'Department', 'Batch'].map(col => (
            <code key={col} style={{ background: 'rgba(59,130,246,0.15)', padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>{col}</code>
          ))}
          <br />Each student will receive an email with their login credentials. They must change password on first login.
        </div>
      </motion.div>

      {/* Step 1: Upload */}
      {!bulkPreview && !bulkResult && (
        <motion.div className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Step 1 — Upload File</h3>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 20 }}>
            <input {...getInputProps()} />
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <FileSpreadsheet size={44} color="#7c3aed" style={{ marginBottom: 10 }} />
                <p style={{ fontWeight: 700, color: '#7c3aed', fontSize: 15 }}>{file.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB • Click to change</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                  <FileSpreadsheet size={36} color="var(--accent)" />
                </div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{isDragActive ? 'Drop here!' : 'Drag & drop Excel or PDF file'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>.xlsx, .xls (max 20MB)</p>
              </>
            )}
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handlePreview} disabled={loading || !file} id="preview-bulk-btn">
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</> : '🔍 Preview Students'}
          </button>
        </motion.div>
      )}

      {/* Step 2: Preview */}
      {bulkPreview && !bulkResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Step 2 — Review & Confirm</h3>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {bulkPreview.newCount} new
              </span>
              {bulkPreview.existingCount > 0 && (
                <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {bulkPreview.existingCount} already exist (will skip)
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Enrollment No.</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.data?.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</td>
                      <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{s.enrollmentNumber}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</td>
                      <td style={{ fontSize: 13 }}>{s.department}</td>
                      <td style={{ fontSize: 13 }}>{s.batch}</td>
                      <td>
                        {s.alreadyExists ? (
                          <span className="badge badge-pending">Exists</span>
                        ) : (
                          <span className="badge badge-approved">New</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => dispatch(removeStudentFromPreview(i))} 
                          className="btn-danger" style={{ padding: '6px 10px' }} title="Remove from list">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={handleReset} style={{ flexShrink: 0 }}>
              <RefreshCw size={14} /> Start Over
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleCreate} disabled={creating || bulkPreview.newCount === 0} id="confirm-bulk-create">
              {creating ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating accounts...</>
              ) : (
                <><Mail size={16} /> Create {bulkPreview.newCount} Accounts & Send Emails</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Result */}
      {bulkResult && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 32, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#10b981' }}>Accounts Created!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>{bulkResult.message}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Created', value: bulkResult.data?.created?.length, color: '#10b981' },
              { label: 'Skipped', value: bulkResult.data?.skipped?.length, color: '#f59e0b' },
              { label: 'Failed', value: bulkResult.data?.failed?.length, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color, marginBottom: 4 }}>{value || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={handleReset} style={{ justifyContent: 'center' }} id="bulk-create-again">
            <RefreshCw size={15} /> Create Another Batch
          </button>
        </motion.div>
      )}

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
