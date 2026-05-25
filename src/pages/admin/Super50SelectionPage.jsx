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
    <div className="page-layout">
      <header className="mb-12">
        <Link to="/admin/dashboard" className="text-slate-600 hover:text-purple-400 flex items-center gap-2 text-sm font-bold mb-6 transition-colors group">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <Upload size={20} className="text-purple-500" /> Upload Selection List
            </h3>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-slate-200 hover:border-white/20 bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet size={48} className="text-purple-500 mx-auto" />
                  <p className="font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet size={32} className="text-gray-600" />
                  </div>
                  <p className="text-slate-900 font-bold">Drop Excel here or click to browse</p>
                  <p className="text-xs text-slate-600">Expected column: "Email"</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Processing Selection...' : 'Apply Selection'}
            </button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 flex gap-4">
            <Info className="text-blue-400 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-300 leading-relaxed">
              <p className="font-bold mb-2 uppercase tracking-widest text-[10px]">How it works</p>
              Students whose emails match the uploaded list will instantly gain access to:
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-80">
                <li>Professional Resume Builder</li>
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
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center space-y-6 border-green-500/20 bg-green-500/[0.02]">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto text-green-500">
                <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Selection Updated!</h3>
                <p className="text-slate-500 mt-2">{result.message}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-3xl font-black text-slate-900">{result.data?.modifiedCount || 0}</div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Students Unlocked</div>
                </div>
              </div>
              <button 
                onClick={() => setResult(null)}
                className="text-purple-400 text-sm font-bold hover:text-slate-900 transition-colors"
              >
                Upload another list
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale">
              <Star size={64} className="text-gray-700" />
              <h3 className="text-xl font-bold text-slate-600">Waiting for data...</h3>
              <p className="text-sm text-gray-600 max-w-xs">Results of your Super 50 selection will appear here after upload.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Super50SelectionPage;
