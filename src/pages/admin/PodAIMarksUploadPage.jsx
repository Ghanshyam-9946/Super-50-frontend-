import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, Info, FileText, Trash2, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PodAIMarksUploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  
  const fetchHistoryAndAnalytics = async () => {
    setFetchingHistory(true);
    try {
      const [histRes, analRes] = await Promise.all([
        api.get('/podai/history'),
        api.get('/podai/analytics')
      ]);
      setHistory(histRes.data.data || []);
      setAnalytics(analRes.data.data || null);
    } catch (error) {
      toast.error('Failed to load history and analytics');
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndAnalytics();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10485760, // 10MB
    onDrop: (accepted) => setFile(accepted[0]),
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an Excel file');
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      const { data } = await api.post('/podai/upload', formData);
      setResult(data);
      toast.success(data.message || 'Marks uploaded successfully');
      fetchHistoryAndAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload marks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testName, testDate) => {
    if (!window.confirm(`Are you sure you want to delete the upload for "${testName}"?`)) return;

    try {
      await api.delete('/podai/upload', { data: { testName, testDate } });
      toast.success('Upload deleted successfully');
      fetchHistoryAndAnalytics();
    } catch (error) {
      toast.error('Failed to delete upload');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center gap-6 glass-card p-8 rounded-3xl mb-8">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-500 border border-fuchsia-200 shadow-sm shrink-0">
          <Upload size={32} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Pod AI Marks Upload</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Upload an Excel sheet to automatically sync Pod AI marks and recalculate student Super50 scores.</p>
        </div>
      </header>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Total Uploads</div>
            <div className="text-4xl font-black text-[var(--text-primary)]">{analytics.totalUploads}</div>
          </div>
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Global Average</div>
            <div className="text-4xl font-black text-emerald-500">{analytics.globalAverage.toFixed(1)}</div>
          </div>
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Top Performer</div>
            <div className="text-lg font-black text-[var(--primary)]">{analytics.topPerformers?.[0]?.name || 'N/A'}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="glass-card p-8 space-y-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-[var(--text-primary)] flex items-center gap-3">
              <FileSpreadsheet size={24} className="text-[var(--primary)]" /> Upload Excel Sheet
            </h3>

            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                isDragActive ? 'border-[var(--primary)] bg-purple-50/50' : 'border-slate-200 hover:border-[var(--primary-light)] bg-slate-50/30'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-2 border border-fuchsia-100 shadow-sm">
                    <FileSpreadsheet size={32} className="text-fuchsia-500 mx-auto" />
                  </div>
                  <p className="font-display font-black text-lg text-[var(--text-primary)]">{file.name}</p>
                  <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-sm">
                    <FileSpreadsheet size={32} className="text-slate-400" />
                  </div>
                  <p className="text-[var(--text-primary)] font-display font-black text-xl">Drop Excel here or click</p>
                  <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">Requires columns: Enrollment Number, Marks, Test Name</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-4 text-[15px] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
              {loading ? 'Processing Upload...' : 'Process Marks'}
            </button>
          </div>

          <div className="bg-fuchsia-50 border border-fuchsia-200 shadow-sm rounded-[1.2rem] p-6 flex gap-4">
            <Info className="text-fuchsia-500 shrink-0" size={24} />
            <div className="text-[13px] text-fuchsia-900 leading-relaxed font-medium">
              <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-fuchsia-600">Expected Columns</p>
              <ul className="list-disc pl-4 space-y-1 opacity-90 text-fuchsia-800">
                <li><strong>Enrollment Number / Roll Number</strong></li>
                <li><strong>Student Name</strong> (Optional, for mismatch checks)</li>
                <li><strong>Marks</strong> (Numeric)</li>
                <li><strong>Test Name</strong> (e.g. Assessment 1)</li>
                <li><strong>Date</strong> (Optional, defaults to today)</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Results / History Section */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          
          {/* Upload Result Feedback */}
          {result && (
            <div className="glass-card border-[2px] border-emerald-400 shadow-sm rounded-3xl p-8 space-y-6 bg-emerald-50/30 relative overflow-hidden">
              <h3 className="text-2xl font-display font-black text-[var(--text-primary)] flex items-center gap-3">
                <CheckCircle className="text-emerald-500" /> Upload Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm text-center">
                  <div className="text-4xl font-display font-black text-emerald-500">{result.data?.updated || 0}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Scores Updated</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-sm text-center">
                  <div className="text-4xl font-display font-black text-rose-500">{result.data?.notFound || 0}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Unmatched</div>
                </div>
              </div>

              {result.data?.unmatchedStudents?.length > 0 && (
                <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                  <p className="text-[12px] font-bold text-rose-600 flex items-center gap-2 mb-2">
                    <AlertCircle size={14} /> Unmatched Students (Skipped):
                  </p>
                  <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {result.data.unmatchedStudents.map((s, i) => (
                      <li key={i} className="flex justify-between bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-light)]">
                        <span className="font-bold">{s.enrollment}</span>
                        <span>{s.name} - {s.marks} marks</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                onClick={() => { setResult(null); setFile(null); }}
                className="text-[var(--primary)] text-[12px] font-black uppercase tracking-widest hover:text-[var(--primary-dark)] transition-colors w-full text-center"
              >
                Clear Result
              </button>
            </div>
          )}

          {/* Upload History */}
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Upload History</h3>
              <button onClick={fetchHistoryAndAnalytics} className="btn-outline-premium p-2 rounded-lg">
                <RefreshCw size={14} className={fetchingHistory ? 'animate-spin' : ''} />
              </button>
            </div>

            {fetchingHistory ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-light)] rounded-2xl">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No past uploads found.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {history.map((h, i) => (
                  <div key={i} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">{h._id.testName}</h4>
                      <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1 flex gap-3">
                        <span>{new Date(h._id.testDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{h.totalStudents} Students</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Avg Score</div>
                        <div className="text-sm font-black text-emerald-500">{h.averageMarks.toFixed(1)}</div>
                      </div>
                      <button 
                        onClick={() => handleDelete(h._id.testName, h._id.testDate)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Delete Upload"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default PodAIMarksUploadPage;
