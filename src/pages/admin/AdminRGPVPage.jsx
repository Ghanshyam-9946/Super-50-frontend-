import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Search, Loader2, Award, ChevronDown, Check, X, FileText, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BATCHES = ['2020-24', '2021-25', '2022-26', '2023-27', '2024-28'];

export default function AdminRGPVPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Filters and upload state
  const [selectedSem, setSelectedSem] = useState('5'); // Default to 5th semester as in request
  const [selectedBatch, setSelectedBatch] = useState('2023-27'); // Default to 2023-27 batch
  const [uploadSem, setUploadSem] = useState('5');
  const [uploadBatch, setUploadBatch] = useState('2023-27');
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, [selectedSem, selectedBatch]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = [];
      if (selectedSem !== 'all') params.push(`semester=${selectedSem}`);
      if (selectedBatch !== 'all') params.push(`batch=${selectedBatch}`);
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
      const { data } = await api.get(`/rgpv/results${queryStr}`);
      setResults(data.data);
    } catch (error) {
      toast.error('Failed to load RGPV results');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an Excel file');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('semester', uploadSem);
    fd.append('batch', uploadBatch);

    setUploading(true);
    const toastId = toast.loading('Uploading and processing RGPV sheet...');
    try {
      const { data } = await api.post('/rgpv/upload', fd);
      toast.success(data.message || 'RGPV results updated successfully', { id: toastId });
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById('rgpv-file-input');
      if (fileInput) fileInput.value = '';
      fetchResults();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload RGPV sheet', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete all RGPV results for Semester ${selectedSem}? This action is irreversible.`)) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/rgpv/upload', { data: { semester: selectedSem } });
      toast.success(`Semester ${selectedSem} RGPV results deleted`);
      fetchResults();
    } catch (error) {
      toast.error('Failed to delete semester results');
    } finally {
      setDeleting(false);
    }
  };

  // Filter A-Z student list locally by search query
  const filteredResults = results.filter(r => 
    r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.studentId?.enrollmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.studentId?.enrollmentNo?.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamically extract all unique subject keys present in the loaded dataset
  const subjectKeys = Array.from(
    new Set(filteredResults.flatMap(r => Object.keys(r.grades || {})))
  ).sort();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-200 shadow-sm shrink-0">
              <Award size={32} />
            </div>
            RGPV Marks Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Upload and manage students' official RGPV university grades, SGPA, and CGPA metrics.</p>
        </div>
      </header>

      {/* Main Grid: Upload Pane and Table Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Upload Sheet Form (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-slate-200 bg-white rounded-3xl shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload RGPV Marks Sheet</h3>
              <p className="text-xs text-slate-500 mt-1">Select the target semester and drop your parsed spreadsheet.</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Semester</label>
                  <select
                    value={uploadSem}
                    onChange={(e) => setUploadSem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Batch</label>
                  <select
                    value={uploadBatch}
                    onChange={(e) => setUploadBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    {BATCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">RGPV Excel File (.xlsx, .xls)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 relative">
                  <input
                    type="file"
                    id="rgpv-file-input"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-500 border border-indigo-100 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {file ? file.name : 'Choose or drop RGPV Excel sheet'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Max size 10MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn-premium w-full py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl shadow-sm uppercase tracking-widest"
              >
                {uploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <><Upload size={16} /> Upload Sheet</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Interactive Table Grid (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 border border-slate-200 bg-white rounded-3xl shadow-sm space-y-6">
            
            {/* Toolbar Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">View Sem:</span>
                  <select
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Batch:</span>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    <option value="all">All Batches</option>
                    {BATCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                {selectedSem !== 'all' && results.length > 0 && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-colors shadow-sm"
                    title="Delete all results for selected semester"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 size={36} className="animate-spin text-indigo-500" />
                <p className="text-xs font-bold uppercase tracking-wider">Syncing RGPV records...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <ClipboardList size={40} className="text-slate-300 mx-auto mb-3 opacity-60" />
                <h4 className="text-sm font-black text-slate-900">No RGPV records found</h4>
                <p className="text-xs text-slate-500 mt-1">Upload a semester spreadsheet sheet on the left to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm max-h-[500px]">
                <table className="w-full text-left text-[12px] font-medium text-slate-600 border-collapse">
                  <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-black tracking-widest border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 bg-slate-50">Student Name</th>
                      <th className="px-4 py-3 bg-slate-50">Roll No</th>
                      <th className="px-4 py-3 bg-slate-50 text-center">Sem</th>
                      {subjectKeys.map(key => (
                        <th key={key} className="px-3 py-3 text-center bg-slate-50 whitespace-nowrap min-w-[70px]">{key}</th>
                      ))}
                      <th className="px-4 py-3 text-center bg-slate-50 font-black text-indigo-600">SGPA</th>
                      <th className="px-4 py-3 text-center bg-slate-50 font-black text-indigo-600">CGPA</th>
                      <th className="px-4 py-3 text-right bg-slate-50">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredResults.map((res) => (
                      <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {res.studentId?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          {res.studentId?.enrollmentNumber || res.studentId?.enrollmentNo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {res.semester}
                        </td>
                        {subjectKeys.map(key => {
                          const grade = res.grades?.[key] || '-';
                          return (
                            <td key={key} className="px-3 py-3 text-center font-bold text-slate-700 font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                ['A+', 'A', 'B+', 'B'].includes(grade) ? 'text-emerald-600 bg-emerald-50' :
                                ['C+', 'C'].includes(grade) ? 'text-blue-600 bg-blue-50' :
                                grade === '-' ? 'text-slate-400' : 'text-rose-600 bg-rose-50'
                              }`}>
                                {grade}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center font-black text-slate-900 bg-indigo-50/20">
                          {res.sgpa?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-slate-900 bg-indigo-50/20">
                          {res.cgpa?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            res.resultDecision === 'PASS' 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}>
                            {res.resultDecision}
                          </span>
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
}
