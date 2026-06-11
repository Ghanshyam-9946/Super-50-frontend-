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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="mb-8">
        <Link to="/admin/dashboard" className="text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-2 text-[13px] font-black uppercase tracking-widest mb-6 transition-colors group w-max">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center gap-6 glass-card p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-500 border border-fuchsia-200 shadow-sm shrink-0">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Drive Result Upload</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-2">Upload dynamic Excel results and map columns to track student placement rounds.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="glass-card p-8 space-y-8 shadow-sm">
            <h3 className="text-xl font-display font-black text-[var(--text-primary)] flex items-center gap-3">
              <Upload size={24} className="text-[var(--primary)]" /> Upload Excel Sheet
            </h3>

            {/* Drive Selection */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Drive</label>
              <div className="relative">
                <select 
                  value={selectedDrive} 
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  className="w-full bg-white border border-[var(--border-light)] rounded-2xl py-3.5 pl-4 pr-10 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all appearance-none shadow-sm cursor-pointer"
                >
                  <option value="">-- Choose a Placement Drive --</option>
                  {drives.map(drive => (
                    <option key={drive._id} value={drive._id}>{drive.companyName}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

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
                  <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">Only .xlsx or .xls files</p>
                </div>
              )}
            </div>

            {/* Dynamic Headings */}
            {file && fileColumns.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Select Round Columns (Priority Wise - Max 5)
                </label>
                <div className="bg-[var(--bg-app)] border border-[var(--border-light)] rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar shadow-inner-sm">
                  {fileColumns.map((col, index) => {
                    const isChecked = headings.includes(col);
                    const priorityIndex = headings.indexOf(col);
                    
                    return (
                      <div 
                        key={index} 
                        onClick={() => toggleHeading(col)}
                        className={`flex items-center justify-between p-3.5 rounded-[1.2rem] cursor-pointer transition-all border ${
                          isChecked 
                            ? 'bg-fuchsia-50 border-fuchsia-200 shadow-sm' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked ? 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-sm' : 'border-slate-300 bg-slate-50'
                          }`}>
                            {isChecked && <CheckCircle size={14} />}
                          </div>
                          <span className={`text-[14px] font-bold ${isChecked ? 'text-fuchsia-700' : 'text-slate-600'}`}>{col}</span>
                        </div>
                        
                        {isChecked && (
                          <div className="px-2.5 py-1 bg-fuchsia-100 text-fuchsia-600 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm">
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
              className="btn-premium w-full py-4 text-[15px] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Processing Results...' : 'Upload Results'}
            </button>
          </div>

          <div className="bg-fuchsia-50 border border-fuchsia-200 shadow-sm rounded-[1.2rem] p-6 flex gap-4">
            <Info className="text-fuchsia-500 shrink-0" size={24} />
            <div className="text-[13px] text-fuchsia-900 leading-relaxed font-medium">
              <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-fuchsia-600">How it works</p>
              <p className="opacity-90 mb-3 text-fuchsia-800">
                First upload your Excel sheet. The system will extract the columns. 
                Select the columns in order (priority wise) that represent the rounds.
                The system will automatically find students by "Enrollment Number" or "Email" and update their progress.
              </p>
              <p className="opacity-90 text-fuchsia-800">
                If a cell under that heading says <strong>"Selected"</strong>, <strong>"Shortlisted"</strong>, <strong>"Cleared"</strong>, or <strong>"Yes"</strong>, the student clears that round. Otherwise, they are eliminated.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {result ? (
            <div className="glass-card border-[2px] border-emerald-400 shadow-sm rounded-3xl p-10 text-center space-y-8 bg-emerald-50/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-100 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-200 shadow-sm relative z-10">
                <CheckCircle size={48} />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-display font-black text-[var(--text-primary)]">Upload Successful!</h3>
                <p className="text-[var(--text-secondary)] font-medium mt-3 text-lg">Student placement results have been updated.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 relative z-10">
                <div className="p-8 rounded-3xl bg-white border border-emerald-200 shadow-sm">
                  <div className="text-5xl font-display font-black text-emerald-500">{result.data?.updated || 0}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Updated Records</div>
                </div>
                <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-sm">
                  <div className="text-5xl font-display font-black text-rose-500">{result.data?.notFound || 0}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Not Found</div>
                </div>
              </div>
              
              <button 
                onClick={() => { 
                  setResult(null); 
                  setFile(null); 
                  setHeadings([]); 
                  setFileColumns([]); 
                }}
                className="text-[var(--primary)] text-[13px] font-black uppercase tracking-widest hover:text-[var(--primary-dark)] transition-colors relative z-10"
              >
                Upload another result sheet
              </button>
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px] border-dashed">
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center shadow-sm">
                <Building2 size={48} className="text-slate-300" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-black text-[var(--text-primary)] mb-2">Waiting for data...</h3>
                <p className="text-[14px] text-[var(--text-secondary)] font-medium max-w-sm mx-auto">Result updates will appear here securely after a successful upload.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DriveResultUpload;
