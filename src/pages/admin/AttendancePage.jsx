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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-500 border border-cyan-200 shadow-sm shrink-0">
              <ClipboardList size={32} />
            </div>
            Attendance Upload
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Upload ERP attendance Excel to automatically update Super 50 students.</p>
        </motion.div>
      </header>

      {/* Info box */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 shadow-sm rounded-2xl p-6 flex gap-4">
        <Info size={24} className="text-blue-500 shrink-0" />
        <div className="text-[13px] text-blue-900 leading-relaxed font-medium">
          <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-600">Expected Excel columns</p>
          <code className="bg-white px-2 py-0.5 rounded text-blue-700 font-bold border border-blue-100 shadow-sm mr-2">EnrollmentNumber</code> 
          <code className="bg-white px-2 py-0.5 rounded text-blue-700 font-bold border border-blue-100 shadow-sm mr-2">Name</code> 
          <code className="bg-white px-2 py-0.5 rounded text-blue-700 font-bold border border-blue-100 shadow-sm">Attendance%</code>
          <div className="mt-2 text-blue-800/80">The system will automatically filter only Super 50 students and update their attendance scores.</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="glass-card p-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
              <Upload size={24} className="text-[var(--primary)]" /> Upload ERP Sheet
            </h3>

            {/* Dropzone */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer mb-6 ${
                isDragActive ? 'border-[var(--primary)] bg-purple-50/50' : 'border-slate-200 hover:border-[var(--primary-light)] bg-slate-50/30'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-sm">
                    <FileSpreadsheet size={32} className="text-emerald-500 mx-auto" />
                  </div>
                  <p className="font-display font-black text-lg text-[var(--text-primary)]">{file.name}</p>
                  <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-sm">
                    <Upload size={32} className="text-slate-400" />
                  </div>
                  <p className="text-[var(--text-primary)] font-display font-black text-xl">{isDragActive ? 'Drop here!' : 'Drag & drop Excel file'}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">.xlsx or .xls (max 20MB)</p>
                </div>
              )}
            </div>

            {/* Optional metadata */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Batch (optional)</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                  placeholder="e.g., 2023-27"
                  value={meta.batch} onChange={(e) => setMeta({ ...meta, batch: e.target.value })} id="att-batch" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Semester (optional)</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                  placeholder="e.g., Sem 4"
                  value={meta.semester} onChange={(e) => setMeta({ ...meta, semester: e.target.value })} id="att-semester" 
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Total Working Days (optional)</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                type="number" placeholder="e.g., 90"
                value={meta.totalWorkingDays} onChange={(e) => setMeta({ ...meta, totalWorkingDays: e.target.value })} id="att-working-days" 
              />
            </div>

            <button 
              className="btn-premium w-full py-3.5 flex items-center justify-center gap-2"
              onClick={handleUpload} disabled={loading || !file} id="upload-attendance-btn">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Upload size={18} /> Upload & Update Attendance</>}
            </button>
          </div>

          {/* Last upload result */}
          {lastUploadResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card border-[2px] border-emerald-400 shadow-sm rounded-3xl p-8 bg-emerald-50/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                  <CheckCircle size={20} />
                </div>
                <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">Upload Successful!</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                {[
                  { label: 'Total Rows Parsed', value: lastUploadResult.data?.totalRows },
                  { label: 'Super 50 Updated', value: lastUploadResult.data?.super50Found },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                    <div className="text-4xl font-display font-black text-emerald-500 mb-1">{value}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* History */}
        <motion.div className="glass-card p-8 h-fit shadow-sm max-h-[800px] flex flex-col"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-6">Upload History</h3>
          
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-slate-50/50">
              <ClipboardList size={40} className="text-slate-300 mb-3" />
              <p className="text-[13px] font-bold text-slate-500">No uploads yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {history.map((h) => (
                <div key={h._id} className="p-5 bg-[var(--bg-app)] rounded-[1.2rem] border border-[var(--border-light)] hover:border-[var(--primary-light)] transition-colors group shadow-inner-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[var(--text-primary)] mb-1 truncate">{h.fileName}</div>
                      <div className="text-[11px] font-bold text-[var(--text-secondary)] truncate">
                        {h.batch && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1">Batch: {h.batch}</span>}
                        {h.semester && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1">{h.semester}</span>}
                        <span className="opacity-70 ml-1">By {h.uploadedBy?.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mt-1">
                      {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5 w-max">
                      <Users size={12} /> {h.processedCount} updated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
