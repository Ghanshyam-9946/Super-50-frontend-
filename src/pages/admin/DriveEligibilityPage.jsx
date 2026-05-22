import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Briefcase, Upload, FileSpreadsheet, CheckCircle, Loader2, Info, ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DriveEligibilityPage = () => {
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
      const { data } = await api.post('/admin/upload-eligibility', formData);
      setResult(data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload eligibility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <header className="mb-12">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-purple-400 flex items-center gap-2 text-sm font-bold mb-6 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Briefcase size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Drive Eligibility Upload</h1>
            <p className="text-gray-400 mt-1">Publish student eligibility for specific company drives via Excel.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Upload size={20} className="text-blue-500" /> Upload Eligibility List
            </h3>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet size={48} className="text-blue-500 mx-auto" />
                  <p className="font-bold text-white">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet size={32} className="text-gray-600" />
                  </div>
                  <p className="text-white font-bold">Drop Excel here or click to browse</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Required: "Email", "CompanyName"</p>
                    <p>Optional: "Package", "Deadline"</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Processing Eligibility...' : 'Upload Eligibility'}
            </button>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 flex gap-4">
            <Info className="text-purple-400 flex-shrink-0" size={20} />
            <div className="text-sm text-purple-300 leading-relaxed">
              <p className="font-bold mb-2 uppercase tracking-widest text-[10px]">Excel Format Guide</p>
              Your Excel sheet should have the following headers (case-insensitive):
              <ul className="list-disc list-inside mt-2 space-y-1 opacity-80">
                <li><code className="bg-white/10 px-1 rounded">Email</code>: Student's registered email</li>
                <li><code className="bg-white/10 px-1 rounded">CompanyName</code>: Name of the hiring company</li>
                <li><code className="bg-white/10 px-1 rounded">Package</code>: Salary package (optional)</li>
                <li><code className="bg-white/10 px-1 rounded">Deadline</code>: Drive application date (optional)</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {result ? (
            <div className="glass-card p-8 text-center space-y-6 border-blue-500/20 bg-blue-500/[0.02]">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
                <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Upload Successful!</h3>
                <p className="text-gray-400 mt-2">{result.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                  <div className="text-3xl font-black text-blue-400">{result.data?.updated || 0}</div>
                  <div className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mt-1 font-mono">Status Updates</div>
                </div>
                <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5">
                  <div className="text-3xl font-black text-purple-400">{result.data?.created || 0}</div>
                  <div className="text-[10px] font-bold text-purple-500/60 uppercase tracking-widest mt-1 font-mono">New Drives</div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 text-left">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Operations Summary</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Successfully Processed</span>
                    <span className="text-green-400 font-bold">{result.data?.updated || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Database Errors</span>
                    <span className="text-red-400 font-bold">{result.data?.errors?.length || 0}</span>
                  </div>
                </div>
              </div>
              {result.data?.errors?.length > 0 && (
                <div className="text-left bg-red-500/5 border border-red-500/10 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Errors / Warnings</p>
                  {result.data.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-300/60 mb-1">• {err}</p>
                  ))}
                </div>
              )}
              <button 
                onClick={() => setResult(null)}
                className="text-blue-400 text-sm font-bold hover:text-white transition-colors"
              >
                Upload another eligibility list
              </button>
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale">
              <Building2 size={64} className="text-gray-700" />
              <h3 className="text-xl font-bold text-gray-500">Waiting for data...</h3>
              <p className="text-sm text-gray-600 max-w-xs">Eligibility statistics and drive updates will appear here after upload.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DriveEligibilityPage;
