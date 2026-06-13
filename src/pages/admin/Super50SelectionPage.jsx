import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Star, Upload, FileSpreadsheet, CheckCircle, Loader2, Info, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Super50SelectionPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
      const { data } = await api.post('/admin/select-super50', formData);
      setResult(data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="mb-8">
        <Link to="/admin/dashboard" className="text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-2 text-[13px] font-black uppercase tracking-widest mb-6 transition-colors group w-max">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center gap-6 glass-card p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-sm shrink-0">
            <Star size={32} className="fill-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Super 50 Selection</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-2">Unlock premium dashboard features for selected students by uploading their email list.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="bg-blue-500/10 border border-blue-500/20 shadow-sm rounded-[1.2rem] p-6 flex gap-4">
            <Info className="text-blue-500 shrink-0" size={24} />
            <div className="text-[13px] text-[var(--text-primary)] leading-relaxed font-medium w-full">
              <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-500">How it works</p>
              Students whose emails match the uploaded list will instantly gain access to:
              <ul className="list-disc list-inside mt-3 space-y-2 text-[var(--text-secondary)] mb-4">
                <li>Exclusive Placement Drives</li>
                <li>High-Impact Project Tracking</li>
                <li>Ecosystem Leaderboard Rank</li>
              </ul>
              <div className="border-t border-[var(--border-light)] pt-4 mt-2">
                <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-500">Sample Excel Format</p>
                <a 
                  href="/upload/super%2050.xlsx" 
                  download="super 50.xlsx"
                  className="inline-flex items-center gap-2 bg-[var(--bg-select)] border border-blue-500/30 hover:border-blue-500 text-blue-500 px-4 py-2.5 rounded-xl shadow-sm transition-all font-bold text-sm"
                >
                  <FileSpreadsheet size={18} />
                  Download Sample Excel File
                </a>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-[var(--text-primary)] flex items-center gap-3">
              <Upload size={24} className="text-[var(--primary)]" /> Upload Selection List
            </h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                isDragActive ? 'border-[var(--primary)] bg-purple-500/5' : 'border-[var(--border-light)] hover:border-[var(--primary-light)] bg-[var(--bg-input)]/50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-sm">
                    <FileSpreadsheet size={40} className="text-[var(--primary)] mx-auto" />
                  </div>
                  <p className="font-display font-black text-lg text-[var(--text-primary)]">{file.name}</p>
                  <p className="text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-20 h-20 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center mx-auto mb-4 border border-[var(--border-light)] shadow-sm">
                    <FileSpreadsheet size={40} className="text-slate-400" />
                  </div>
                  <p className="text-[var(--text-primary)] font-display font-black text-xl">Drop Excel here or click to browse</p>
                  <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">Expected column: "Email"</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-4 text-sm flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Processing Selection...' : 'Apply Selection'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {result ? (
            <div className="glass-card border-[2px] border-emerald-500/30 shadow-sm rounded-3xl p-12 text-center space-y-8 bg-emerald-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/30 shadow-sm relative z-10">
                <CheckCircle size={48} />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-display font-black text-[var(--text-primary)]">Selection Updated!</h3>
                <p className="text-[var(--text-secondary)] font-medium mt-3 text-lg">{result.message}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-4 relative z-10">
                <div className="p-8 rounded-3xl bg-[var(--bg-select)] border border-[var(--border-light)] shadow-sm">
                  <div className="text-6xl font-display font-black text-[var(--text-primary)]">{result.data?.modifiedCount || 0}</div>
                  <div className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-2">Students Unlocked</div>
                </div>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-[var(--primary)] text-[13px] font-black uppercase tracking-widest hover:text-[var(--primary-dark)] transition-colors relative z-10"
              >
                Upload another list
              </button>
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px] border-dashed">
              <div className="w-24 h-24 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-3xl flex items-center justify-center shadow-sm">
                <Star size={48} className="text-slate-300" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-black text-[var(--text-primary)] mb-2">Waiting for data...</h3>
                <p className="text-[14px] text-[var(--text-secondary)] font-medium max-w-sm mx-auto">Results of your Super 50 selection will appear here after a successful upload.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Super50SelectionPage;
