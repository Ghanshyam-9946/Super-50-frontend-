import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, UserPlus, FileSpreadsheet, Users, ChevronDown, ChevronUp,
  Search, X, CheckCircle, Mail, Phone, BookOpen, GraduationCap, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EnrollStudentsPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnrolledStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get('/placement/enrolled-students');
      setBatches(res.data.data.batches || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      toast.error('Failed to load enrolled students');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an Excel file');
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    const toastId = toast.loading('Enrolling students & sending emails...');
    try {
      const res = await api.post('/placement/enroll-students', formData);
      toast.success(res.data.message || 'Students enrolled!', { id: toastId, duration: 5000 });
      setFile(null);
      document.getElementById('enroll-excel-input').value = '';
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const batchColors = [
    { bg: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/20', text: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-400' },
    { bg: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/20', text: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-400' },
    { bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400' },
    { bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-400' },
    { bg: 'from-rose-500/10 to-pink-500/5', border: 'border-rose-500/20', text: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-400' },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UserPlus className="text-emerald-500" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">Enroll Students</h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium mt-0.5">Upload Excel to enroll students in T&P placement drives</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-card px-5 py-3 flex items-center gap-3">
              <Users className="text-emerald-500" size={20} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Total Enrolled</p>
                <p className="text-2xl font-display font-black text-[var(--text-primary)]">{total}</p>
              </div>
            </div>
            <button onClick={fetchEnrolledStudents} className="btn-outline-premium p-3 rounded-xl" title="Refresh">
              <RefreshCw size={18} className={loadingStudents ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Excel Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card p-8"
      >
        <h2 className="text-lg font-display font-black text-[var(--text-primary)] mb-1">Upload Enrollment Excel</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">
          Excel should have columns: <span className="font-bold text-[var(--text-primary)]">Name, Enrollment No, Email, Mobile</span> (batch & department optional)
        </p>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 hover:border-[var(--primary)]/50'
            }`}
            onClick={() => document.getElementById('enroll-excel-input').click()}
          >
            <input
              id="enroll-excel-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <div className="space-y-3">
                <FileSpreadsheet className="text-emerald-500 mx-auto" size={48} />
                <p className="text-base font-black text-[var(--text-primary)]">{file.name}</p>
                <p className="text-[11px] text-emerald-500 uppercase font-bold tracking-widest">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center justify-center mx-auto">
                  <Upload className="text-[var(--text-secondary)]" size={28} />
                </div>
                <p className="text-base font-black text-[var(--text-primary)]">Drop Excel file here or click to browse</p>
                <p className="text-xs text-[var(--text-secondary)]">Supports .xlsx and .xls files</p>
              </div>
            )}
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Required Columns', value: 'Name, Enrollment No, Email', icon: FileSpreadsheet },
              { label: 'Optional Columns', value: 'Mobile, Department, Batch', icon: BookOpen },
              { label: 'On Success', value: 'Email sent to each student', icon: Mail },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--bg-input)]/30 border border-[var(--border-light)] rounded-xl p-3 flex items-start gap-3">
                <item.icon size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{item.label}</p>
                  <p className="text-[12px] font-bold text-[var(--text-primary)] mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="btn-premium w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enrolling & Sending Emails...</>
            ) : (
              <><UserPlus size={20} /> Upload & Enroll Students</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Enrolled Students by Batch */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-display font-black text-[var(--text-primary)]">Enrolled Students by Batch</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)] opacity-60" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium w-52"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loadingStudents ? (
          <div className="glass-card p-16 text-center">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">Loading enrolled students...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="glass-card p-16 text-center border-dashed">
            <div className="w-20 h-20 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="text-[var(--text-secondary)] opacity-40" size={40} />
            </div>
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">No Students Enrolled Yet</h3>
            <p className="text-[var(--text-secondary)] font-medium mt-2 max-w-sm mx-auto">Upload an Excel file above to enroll students in the T&P placement system.</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {batches.map((batchData, idx) => {
              const color = batchColors[idx % batchColors.length];
              const isExpanded = expandedBatch === batchData.batch;

              const filteredStudents = searchQuery
                ? batchData.students.filter(s =>
                    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : batchData.students;

              const shouldShow = !searchQuery || filteredStudents.length > 0;
              if (!shouldShow) return null;

              return (
                <motion.div key={batchData.batch} variants={itemVariants} className={`glass-card overflow-hidden border ${color.border}`}>
                  {/* Batch Header — always visible, click to expand */}
                  <button
                    className={`w-full p-6 flex items-center justify-between bg-gradient-to-r ${color.bg} transition-all`}
                    onClick={() => setExpandedBatch(isExpanded ? null : batchData.batch)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl border ${color.border} flex items-center justify-center bg-white/5`}>
                        <GraduationCap className={color.text} size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className={`text-xl font-display font-black ${color.text}`}>Batch {batchData.batch}</h3>
                        <p className="text-[var(--text-secondary)] text-sm font-medium mt-0.5">
                          {searchQuery ? `${filteredStudents.length} of ${batchData.count}` : batchData.count} students enrolled
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`${color.badge} px-4 py-2 rounded-xl border ${color.border} text-sm font-black`}>
                        {batchData.count} Students
                      </div>
                      {isExpanded ? <ChevronUp className={color.text} size={20} /> : <ChevronDown className={color.text} size={20} />}
                    </div>
                  </button>

                  {/* Expanded Students Table */}
                  <AnimatePresence>
                    {(isExpanded || searchQuery) && filteredStudents.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[var(--border-light)] overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-[var(--bg-input)]/30">
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">#</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Name</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Enrollment No</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Email</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Department</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Mobile</th>
                                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-light)]">
                              {filteredStudents.map((student, sIdx) => (
                                <tr key={student._id} className="hover:bg-[var(--bg-input)]/20 transition-colors">
                                  <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-secondary)]">{sIdx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg ${color.badge} border ${color.border} flex items-center justify-center text-xs font-black`}>
                                        {student.name?.[0]?.toUpperCase()}
                                      </div>
                                      <span className="text-[14px] font-bold text-[var(--text-primary)]">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-primary)]">{student.enrollmentNumber || '—'}</td>
                                  <td className="px-6 py-4">
                                    <a href={`mailto:${student.email}`} className={`text-[13px] font-bold ${color.text} flex items-center gap-1 hover:opacity-80`}>
                                      <Mail size={12} /> {student.email}
                                    </a>
                                  </td>
                                  <td className="px-6 py-4 text-[13px] font-medium text-[var(--text-secondary)]">{student.department || '—'}</td>
                                  <td className="px-6 py-4 text-[13px] font-medium text-[var(--text-secondary)]">
                                    {student.mobile ? (
                                      <span className="flex items-center gap-1"><Phone size={12} /> {student.mobile}</span>
                                    ) : '—'}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg w-fit">
                                      <CheckCircle size={12} /> Enrolled
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnrollStudentsPage;
