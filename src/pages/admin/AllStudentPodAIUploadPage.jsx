import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, Info, FileText, Trash2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AllStudentPodAIUploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [selectedUploads, setSelectedUploads] = useState([]);
  
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
    formData.append('isGeneral', 'true'); // Flag to skip Super 50 students
    
    setLoading(true);
    try {
      const { data } = await api.post('/podai/upload', formData);
      setResult(data);
      toast.success(data.message || 'General marks uploaded successfully (Super 50 students skipped)');
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
      setSelectedUploads(selectedUploads.filter(u => !(u.testName === testName && u.testDate === testDate)));
    } catch (error) {
      toast.error('Failed to delete upload');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUploads.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedUploads.length} selected upload(s)?`)) return;

    setLoading(true);
    try {
      await api.post('/podai/upload/bulk-delete', { uploads: selectedUploads });
      toast.success(`${selectedUploads.length} uploads deleted successfully`);
      setSelectedUploads([]);
      fetchHistoryAndAnalytics();
    } catch (error) {
      toast.error('Failed to delete selected uploads');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (upload) => {
    const isSelected = selectedUploads.some(u => u.testName === upload._id.testName && u.testDate === upload._id.testDate);
    if (isSelected) {
      setSelectedUploads(selectedUploads.filter(u => !(u.testName === upload._id.testName && u.testDate === upload._id.testDate)));
    } else {
      setSelectedUploads([...selectedUploads, { testName: upload._id.testName, testDate: upload._id.testDate }]);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-500 border border-fuchsia-200 shadow-sm shrink-0">
              <FileSpreadsheet size={32} />
            </div>
            All Student Pod AI Marks
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">
            Upload assessment sheets for all students. Note: Super 50 students will be skipped to protect their dedicated records.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border border-slate-200 bg-white rounded-3xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Upload General Sheets</h3>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-fuchsia-500 bg-fuchsia-50/50' : 'border-slate-200 hover:border-fuchsia-500/50 bg-slate-50/50'}`}>
              <input {...getInputProps()} />
              <Upload className="mx-auto text-slate-400 mb-4" size={32} />
              <p className="text-xs font-bold text-slate-700">Drag & drop Pod AI sheet here, or click to browse</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">XLSX, XLS files up to 10MB</p>
            </div>

            {file && (
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <FileText className="text-fuchsia-500" size={20} />
                  <div className="truncate max-w-[150px]">
                    <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl shadow-sm uppercase tracking-widest"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Uploading...</>
              ) : (
                <><Upload size={16} /> Upload General Sheet</>
              )}
            </button>
          </div>
        </div>

        {/* Results / History Column */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border border-emerald-200 bg-emerald-50/20 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-emerald-500" size={24} />
                <h4 className="font-bold text-slate-900">Upload Processed successfully</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white border rounded-xl p-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Updated Students</span>
                  <span className="text-xl font-black text-slate-900">{result.data?.updated || 0}</span>
                </div>
                <div className="bg-white border rounded-xl p-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Not Found</span>
                  <span className="text-xl font-black text-slate-900">{result.data?.notFound || 0}</span>
                </div>
                <div className="bg-white border rounded-xl p-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Super 50 (Skipped)</span>
                  <span className="text-xl font-black text-amber-600">Auto-Filtered</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* History table */}
          <div className="glass-card p-6 border border-slate-200 bg-white rounded-3xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Upload History</h3>

            {fetchingHistory ? (
              <div className="py-12 flex justify-center"><Loader2 size={32} className="animate-spin text-fuchsia-500" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No upload history found.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[350px]">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-black tracking-widest border-b">
                    <tr>
                      <th className="p-4 bg-slate-50">Test Name</th>
                      <th className="p-4 bg-slate-50">Upload Date</th>
                      <th className="p-4 bg-slate-50 text-center">Students Graded</th>
                      <th className="p-4 bg-slate-50 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{h._id.testName}</td>
                        <td className="p-4 text-slate-500">{new Date(h._id.testDate).toLocaleString()}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{h.studentCount}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete(h._id.testName, h._id.testDate)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStudentPodAIUploadPage;
