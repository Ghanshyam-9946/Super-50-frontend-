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
    <div className="page-layout p-8 max-w-7xl mx-auto space-y-8">
      <header className="mb-8">
        <Link to="/admin/dashboard" className="text-purple-600 hover:text-purple-700 flex items-center gap-2 text-sm font-bold mb-6 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
            <Star size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Super 50 Selection</h1>
            <p className="text-slate-500 mt-1">Unlock premium dashboard features for selected students.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="glass border border-slate-200/50 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <Upload size={20} className="text-purple-500" /> Upload Selection List
            </h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-slate-200/60 hover:border-purple-500/40 bg-slate-50/50'
                }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet size={48} className="text-purple-500 mx-auto" />
                  <p className="font-bold text-slate-950">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet size={32} className="text-purple-500" />
                  </div>
                  <p className="text-slate-900 font-bold">Drop Excel here or click to browse</p>
                  <p className="text-xs text-slate-500">Expected column: "Email"</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 font-bold"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Processing Selection...' : 'Apply Selection'}
            </button>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex gap-4">
            <Info className="text-blue-500 flex-shrink-0" size={20} />
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-bold mb-2 uppercase tracking-widest text-[10px] text-blue-600">How it works</p>
              Students whose emails match the uploaded list will instantly gain access to:
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-80 text-slate-500 font-medium">
                <li>Exclusive Placement Drives</li>
                <li>High-Impact Project Tracking</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {result ? (
            <div className="glass border border-green-500/20 shadow-sm rounded-3xl p-8 text-center space-y-6 bg-green-500/[0.02]">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-500 border border-green-500/20">
                <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Selection Updated!</h3>
                <p className="text-slate-500 mt-2">{result.message}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="text-3xl font-black text-slate-950">{result.data?.modifiedCount || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Students Unlocked</div>
                </div>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-purple-600 text-sm font-bold hover:text-purple-700 transition-colors"
              >
                Upload another list
              </button>
            </div>
          ) : (
            <div className="glass border border-slate-200/50 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <Star size={64} className="text-slate-300 animate-pulse" />
              <h3 className="text-xl font-bold text-slate-400">Waiting for data...</h3>
              <p className="text-sm text-slate-500 max-w-xs font-medium">Results of your Super 50 selection will appear here after upload.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Super50SelectionPage;
