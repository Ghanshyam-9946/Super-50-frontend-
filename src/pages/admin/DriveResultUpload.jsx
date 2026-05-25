import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, Info, ArrowLeft, Building2, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

import * as XLSX from 'xlsx';

const DriveResultUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  
  const [fileColumns, setFileColumns] = useState([]);
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const { data } = await api.get('/placement/faculty/dashboard');
        setDrives(data.data.drives || []);
      } catch (error) {
        toast.error('Failed to load placement drives');
      }
    };
    fetchDrives();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10485760, // 10MB
    onDrop: (accepted) => {
      const selectedFile = accepted[0];
      setFile(selectedFile);
      setHeadings([]); // Reset headings when new file is uploaded
      
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
            if (headers && headers.length > 0) {
              const validHeaders = headers.filter(h => h && typeof h === 'string' && h.trim() !== '');
              setFileColumns(validHeaders);
            }
          } catch (error) {
            console.error("Error reading excel file", error);
            toast.error("Could not read columns from the Excel file.");
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      }
    },
    multiple: false,
  });

  const toggleHeading = (columnName) => {
    if (headings.includes(columnName)) {
      setHeadings(headings.filter(h => h !== columnName));
    } else {
      if (headings.length < 5) {
        setHeadings([...headings, columnName]);
      } else {
        toast.error('You can only select up to 5 rounds.');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedDrive) return toast.error('Please select a placement drive');
    if (!file) return toast.error('Please select an Excel file');
    
    const validHeadings = headings.filter(h => h.trim() !== '');
    if (validHeadings.length === 0) return toast.error('Please add at least one heading to track');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('driveId', selectedDrive);
    formData.append('headings', JSON.stringify(validHeadings));
    
    setLoading(true);
    try {
      const { data } = await api.post('/placement/results/dynamic-upload', formData);
      setResult(data);
      toast.success('Results uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload results');
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
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Drive Result Upload</h1>
            <p className="text-slate-500 mt-1">Upload dynamic Excel results and track student rounds.</p>
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
              <Upload size={20} className="text-indigo-500" /> Upload Excel Sheet
            </h3>

            {/* Drive Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Drive</label>
              <select 
                value={selectedDrive} 
                onChange={(e) => setSelectedDrive(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose a Placement Drive --</option>
                {drives.map(drive => (
                  <option key={drive._id} value={drive._id}>{drive.companyName}</option>
                ))}
              </select>
            </div>

            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 hover:border-white/20 bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet size={48} className="text-indigo-500 mx-auto" />
                  <p className="font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet size={32} className="text-gray-600" />
                  </div>
                  <p className="text-slate-900 font-bold">Drop Excel here or click to browse</p>
                  <p className="text-xs text-slate-600">Only .xlsx or .xls files</p>
                </div>
              )}
            </div>

            {/* Dynamic Headings */}
            {file && fileColumns.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Select Round Columns (Priority Wise - Max 5)
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {fileColumns.map((col, index) => {
                    const isChecked = headings.includes(col);
                    const priorityIndex = headings.indexOf(col);
                    
                    return (
                      <div 
                        key={index} 
                        onClick={() => toggleHeading(col)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                          isChecked 
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-slate-900' 
                            : 'bg-black/20 border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isChecked ? 'bg-indigo-500 border-indigo-500 text-slate-900' : 'border-gray-600 bg-transparent'
                          }`}>
                            {isChecked && <CheckCircle size={14} />}
                          </div>
                          <span className="text-sm font-medium">{col}</span>
                        </div>
                        
                        {isChecked && (
                          <div className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            Round {priorityIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !file || !selectedDrive}
              className="btn-premium w-full py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Processing Results...' : 'Upload Results'}
            </button>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 flex gap-4">
            <Info className="text-purple-400 flex-shrink-0" size={20} />
            <div className="text-sm text-purple-300 leading-relaxed">
              <p className="font-bold mb-2 uppercase tracking-widest text-[10px]">How it works</p>
              <p className="opacity-80">
                First upload your Excel sheet. The system will extract the columns. 
                Select the columns in order (priority wise) that represent the rounds.
                The system will automatically find students by "Enrollment Number" or "Email" and update their progress.
              </p>
              <p className="opacity-80 mt-2">
                If a cell under that heading says "Selected", "Shortlisted", "Cleared", or "Yes", the student clears that round. Otherwise, they are eliminated.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {result ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center space-y-6 border-indigo-500/20 bg-indigo-500/[0.02]">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto text-indigo-500">
                <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Upload Successful!</h3>
                <p className="text-slate-500 mt-2">Student placement results have been updated.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                  <div className="text-3xl font-black text-indigo-400">{result.data?.updated || 0}</div>
                  <div className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest mt-1 font-mono">Updated Records</div>
                </div>
                <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5">
                  <div className="text-3xl font-black text-red-400">{result.data?.notFound || 0}</div>
                  <div className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest mt-1 font-mono">Not Found</div>
                </div>
              </div>
              
              <button 
                onClick={() => { 
                  setResult(null); 
                  setFile(null); 
                  setHeadings([]); 
                  setFileColumns([]); 
                }}
                className="text-indigo-400 text-sm font-bold hover:text-slate-900 transition-colors"
              >
                Upload another result sheet
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale">
              <Building2 size={64} className="text-gray-700" />
              <h3 className="text-xl font-bold text-slate-600">Waiting for data...</h3>
              <p className="text-sm text-gray-600 max-w-xs">Result updates will appear here after upload.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DriveResultUpload;
