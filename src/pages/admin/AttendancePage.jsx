import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { uploadAttendance, fetchAttendanceHistory } from '../../features/attendance/attendanceSlice';
import { ClipboardList, Upload, FileSpreadsheet, CheckCircle, Users, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const dispatch = useDispatch();
  const { history, lastUploadResult, loading } = useSelector((s) => s.attendance);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ batch: '', semester: '', totalWorkingDays: '' });

  useEffect(() => { dispatch(fetchAttendanceHistory()); }, [dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 20971520, // 20MB
    onDrop: (accepted) => setFile(accepted[0]),
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) { toast.error('Please select an Excel file'); return; }
    const fd = new FormData();
    fd.append('attendance', file);
    if (meta.batch) fd.append('batch', meta.batch);
    if (meta.semester) fd.append('semester', meta.semester);
    if (meta.totalWorkingDays) fd.append('totalWorkingDays', meta.totalWorkingDays);
    const result = await dispatch(uploadAttendance(fd));
    if (!result.error) {
      toast.success(result.payload.message);
      setFile(null);
      dispatch(fetchAttendanceHistory());
    } else toast.error(result.payload);
  };

  return (
    <div className="page-layout">
      <div className="page-header">
        <h1 className="page-title">
          <ClipboardList size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10, color: '#06b6d4' }} />
          Attendance Upload
        </h1>
        <p className="page-subtitle">Upload ERP attendance Excel to automatically update Super 50 students</p>
      </div>

      {/* Info box */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12 }}>
        <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Expected Excel columns:</strong> <code style={{ background: 'rgba(59,130,246,0.15)', padding: '1px 6px', borderRadius: 4 }}>EnrollmentNumber</code>, <code style={{ background: 'rgba(59,130,246,0.15)', padding: '1px 6px', borderRadius: 4 }}>Name</code>, <code style={{ background: 'rgba(59,130,246,0.15)', padding: '1px 6px', borderRadius: 4 }}>Attendance%</code>.
          The system will automatically filter only Super 50 students and update their attendance.
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upload Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Upload ERP Sheet</h3>

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
              <input {...getInputProps()} />
              {file ? (
                <div style={{ textAlign: 'center' }}>
                  <FileSpreadsheet size={40} color="#10b981" style={{ marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, color: '#10b981' }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <>
                  <Upload size={36} style={{ color: 'var(--accent)', marginBottom: 10 }} />
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{isDragActive ? 'Drop here!' : 'Drag & drop Excel file'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>.xlsx or .xls (max 20MB)</p>
                </>
              )}
            </div>

            {/* Optional metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Batch (optional)</label>
                <input className="input-field" style={{ fontSize: 13 }} placeholder="e.g., 2023-27"
                  value={meta.batch} onChange={(e) => setMeta({ ...meta, batch: e.target.value })} id="att-batch" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Semester (optional)</label>
                <input className="input-field" style={{ fontSize: 13 }} placeholder="e.g., Sem 4"
                  value={meta.semester} onChange={(e) => setMeta({ ...meta, semester: e.target.value })} id="att-semester" />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Total Working Days (optional)</label>
              <input className="input-field" style={{ fontSize: 13 }} type="number" placeholder="e.g., 90"
                value={meta.totalWorkingDays} onChange={(e) => setMeta({ ...meta, totalWorkingDays: e.target.value })} id="att-working-days" />
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleUpload} disabled={loading || !file} id="upload-attendance-btn">
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><Upload size={16} /> Upload & Update Attendance</>}
            </button>
          </div>

          {/* Last upload result */}
          {lastUploadResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle size={22} color="#10b981" />
                <span style={{ fontWeight: 700, color: '#10b981' }}>Upload Successful!</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total Rows', value: lastUploadResult.data?.totalRows },
                  { label: 'Super 50 Found', value: lastUploadResult.data?.super50Found },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* History */}
        <motion.div className="bg-white border border-slate-200 shadow-sm rounded-2xl" style={{ padding: 24 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Upload History</h3>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No uploads yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto' }}>
              {history.map((h) => (
                <div key={h._id} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{h.fileName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {h.batch && `Batch: ${h.batch} • `}{h.semester && `${h.semester} • `}
                        By {h.uploadedBy?.name}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(h.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      <Users size={10} style={{ display: 'inline', marginRight: 4 }} />{h.processedCount} updated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
