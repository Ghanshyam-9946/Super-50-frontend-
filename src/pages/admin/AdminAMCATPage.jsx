import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, Info, FileText, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAMCATPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [semester, setSemester] = useState('5');
  const [testName, setTestName] = useState('AMCAT Evaluation');
  const [result, setResult] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setFetchingData(true);
    try {
      const [histRes, resultsRes] = await Promise.all([
        api.get('/amcat/history'),
        api.get('/amcat/results')
      ]);
      setHistory(histRes.data.data || []);
      setStudentResults(resultsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load history and results');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    if (!testName.trim()) return toast.error('Please enter a Test Name');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', semester);
    formData.append('testName', testName);
    
    setLoading(true);
    try {
      const { data } = await api.post('/amcat/upload', formData);
      setResult(data);
      toast.success(data.message || 'AMCAT results uploaded successfully');
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload AMCAT results');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testName, semester, testDate) => {
    if (!window.confirm(`Are you sure you want to delete the upload for "${testName}" (Semester ${semester})?`)) return;

    try {
      await api.delete('/amcat/upload', { data: { testName, semester, testDate } });
      toast.success('Upload deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete upload');
    }
  };

  // Find all unique subjects across loaded student results for dynamic headers
  const getUniqueSubjects = () => {
    const subjects = new Set();
    studentResults.forEach(r => {
      if (r.scores) {
        Object.keys(r.scores).forEach(sub => subjects.add(sub));
      }
    });
    return Array.from(subjects);
  };

  const uniqueSubjects = getUniqueSubjects();

  const filteredResults = studentResults.filter(res => {
    const studentName = res.studentId?.name?.toLowerCase() || '';
    const enroll = (res.studentId?.enrollmentNumber || res.studentId?.enrollmentNo || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || enroll.includes(query);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center gap-6 glass-card p-8 rounded-3xl mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-200 shadow-sm shrink-0">
          <Upload size={32} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">AMCAT Results Dashboard</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Upload AMCAT Excel sheets by semester and view students' scores dynamically.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-8">
          <div className="glass-card p-8 space-y-6 shadow-sm">
            <h3 className="text-xl font-display font-black text-[var(--text-primary)] flex items-center gap-3">
              <FileSpreadsheet size={24} className="text-indigo-500" /> Upload Results
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Test Name</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., AMCAT September 2026"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                isDragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/5'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  <FileSpreadsheet size={32} className="text-indigo-500 mx-auto" />
                  <p className="font-bold text-sm text-[var(--text-primary)]">{file.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileSpreadsheet size={32} className="text-slate-400 mx-auto" />
                  <p className="text-[var(--text-primary)] font-bold text-sm">Drop Excel here or click to browse</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Supports .xlsx, .xls</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-premium w-full py-3.5 text-sm flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {loading ? 'Uploading...' : 'Process Excel'}
            </button>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 shadow-sm rounded-2xl p-6 flex gap-4">
            <Info className="text-indigo-500 shrink-0" size={20} />
            <div className="text-xs text-indigo-900 leading-relaxed font-medium">
              <p className="font-black mb-2 uppercase tracking-widest text-[9px] text-indigo-600">Adaptive excel format</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Requires an <strong>Enrollment Number</strong> column.</li>
                <li>All other columns (e.g. English, Logical, Automata) are treated as subject scores.</li>
                <li>Each semester's subject columns will adapt automatically.</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Upload History & Results List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-8">
          {/* Upload Result Feedback */}
          {result && (
            <div className="glass-card border-[2px] border-emerald-400 shadow-sm rounded-3xl p-6 space-y-4 bg-emerald-50/10">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle className="text-emerald-500" /> Upload Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-center">
                  <div className="text-2xl font-black text-emerald-500">{result.data?.updated || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Scores Synced</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-center">
                  <div className="text-2xl font-black text-rose-500">{result.data?.notFound || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Unmatched</div>
                </div>
              </div>
              {result.data?.unmatchedStudents?.length > 0 && (
                <div className="max-h-24 overflow-y-auto border border-[var(--border-light)] p-2 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-rose-600">Unmatched enrollments (skipped):</p>
                  {result.data.unmatchedStudents.map((s, idx) => (
                    <div key={idx} className="text-[11px] text-[var(--text-secondary)]">{s.enrollment} - {s.name}</div>
                  ))}
                </div>
              )}
              <button onClick={() => setResult(null)} className="text-xs text-indigo-500 font-bold block w-full text-center hover:underline">Clear Summary</button>
            </div>
          )}

          {/* Upload History */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Upload History</h3>
              <button onClick={fetchData} className="p-2 border border-[var(--border-light)] hover:bg-[var(--bg-hover)] rounded-lg">
                <RefreshCw size={14} className={fetchingData ? 'animate-spin' : ''} />
              </button>
            </div>

            {fetchingData ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-center py-6 text-[var(--text-secondary)]">No upload history found.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl p-3.5 hover:shadow-sm transition-all text-xs">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{h._id.testName}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                        Sem {h._id.semester} • {h.totalStudents} Students • {new Date(h._id.testDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(h._id.testName, h._id.semester, h._id.testDate)}
                      className="p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students AMCAT Scores Table */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Student Scores List</h3>
              <input
                type="text"
                placeholder="Search student or enrollment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs w-full sm:w-64 focus:outline-none focus:border-indigo-500 text-[var(--text-primary)]"
              />
            </div>

            {fetchingData ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : filteredResults.length === 0 ? (
              <p className="text-sm text-center py-8 text-[var(--text-secondary)]">No records found.</p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-secondary)] font-bold">
                      <th className="py-3 px-2">Student</th>
                      <th className="py-3 px-2">Enrollment</th>
                      <th className="py-3 px-2">Sem</th>
                      <th className="py-3 px-2">Test Name</th>
                      {uniqueSubjects.map(sub => (
                        <th key={sub} className="py-3 px-2 text-center capitalize">{sub}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r, i) => (
                      <tr key={i} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                        <td className="py-3 px-2 font-semibold">{r.studentId?.name || 'N/A'}</td>
                        <td className="py-3 px-2 font-medium">{r.studentId?.enrollmentNumber || r.studentId?.enrollmentNo || 'N/A'}</td>
                        <td className="py-3 px-2">Sem {r.semester}</td>
                        <td className="py-3 px-2 text-[var(--text-secondary)]">{r.testName}</td>
                        {uniqueSubjects.map(sub => (
                          <td key={sub} className="py-3 px-2 text-center font-bold">
                            {r.scores && r.scores[sub] !== undefined ? r.scores[sub] : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAMCATPage;
