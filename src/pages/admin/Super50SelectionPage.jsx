import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Star,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  Info,
  ArrowLeft,
  Settings as SettingsIcon,
  List,
  Trash2,
  Download,
  AlertCircle,
  Clock,
  X,
  Search,
  Filter,
  Award,
  Github,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Other'
];

const Super50SelectionPage = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'bulk-upload'
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Submissions & Settings states
  const [submissions, setSubmissions] = useState([]);
  const [formSettings, setFormSettings] = useState({
    formEnabled: true,
    startDate: '',
    endDate: ''
  });
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Certificate Photo Modal states
  const [viewingImage, setViewingImage] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Fetch settings and registrations
  const fetchSettingsAndSubmissions = async (silent = false) => {
    if (!silent) setLoadingData(true);
    try {
      const [settingsRes, submissionsRes] = await Promise.all([
        api.get('/selection-form/settings'),
        api.get('/selection-form/submissions')
      ]);
      setFormSettings(settingsRes.data.data);
      setSubmissions(submissionsRes.data.data);
    } catch (err) {
      console.error('Failed to load settings or submissions:', err);
      toast.error('Failed to sync selection form details.');
    } finally {
      if (!silent) setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndSubmissions();
  }, []);

  // Save Settings Helper
  const saveFormSettings = async (newSettings) => {
    try {
      await api.post('/selection-form/settings', newSettings);
      setFormSettings(newSettings);
      toast.success('Form availability settings updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    }
  };

  // Update Status Approve / Reject / Reset
  const handleUpdateStatus = async (id, status) => {
    const toastId = toast.loading(`Setting status to ${status}...`);
    try {
      const res = await api.patch(`/selection-form/submissions/${id}/status`, { status });
      // Update local state list
      setSubmissions(prev => prev.map(s => (s._id === id || s.id === id) ? res.data.data : s));
      toast.success(`Request successfully ${status}!`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status', { id: toastId });
    }
  };

  // Clear All Registrations
  const handleClearSubmissions = async () => {
    if (window.confirm('Are you sure you want to delete all dynamic submissions? This cannot be undone.')) {
      try {
        await api.delete('/selection-form/submissions');
        setSubmissions([]);
        toast.success('All submissions cleared.');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to clear submissions');
      }
    }
  };

  // Bulk Approve Registrations
  const handleBulkApprove = async () => {
    const pendingIds = submissions.filter(s => s.status === 'pending' || !s.status).map(s => s._id || s.id);
    if (pendingIds.length === 0) {
      toast.error('No pending requests to approve.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to approve ${pendingIds.length} pending requests?`)) {
      const toastId = toast.loading('Approving requests...');
      try {
        await api.post('/selection-form/submissions/bulk-approve', { ids: pendingIds });
        toast.success(`Successfully approved ${pendingIds.length} requests!`, { id: toastId });
        fetchSettingsAndSubmissions(true);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to bulk approve', { id: toastId });
      }
    }
  };

  // Excel Exporter
  const exportToExcel = () => {
    if (submissions.length === 0) {
      toast.error('No submissions to export.');
      return;
    }
    const data = submissions.map(s => ({
      'Full Name': s.fullName,
      'Enrollment Number': s.enrollmentNumber,
      'Email': s.email,
      'Mobile Number': s.mobileNumber,
      'Branch': s.branch,
      'Section': s.section,
      'Certificate Image Attached': s.certificateImage ? 'Yes' : 'No',
      'GitHub Profile': s.githubProfile || '',
      'Hackathon Participation': s.hackathonParticipation,
      'Hackathon Details': s.hackathonDetails || '',
      'Skills': s.skills || '',
      'Approval Status': s.status || 'pending',
      'Date': new Date(s.createdAt || s.submittedAt).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'super50_selection_requests.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Exported to Excel successfully!');
  };

  // Dropzone Hook for legacy bulk excel upload
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

    setUploadLoading(true);
    try {
      const { data } = await api.post('/admin/select-super50', formData);
      setUploadResult(data);
      toast.success(data.message);
      fetchSettingsAndSubmissions(true); // reload list silently
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update selection');
    } finally {
      setUploadLoading(false);
    }
  };

  // Search and Filter submissions logic
  const filteredSubmissions = submissions.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query ||
      s.fullName.toLowerCase().includes(query) ||
      s.enrollmentNumber.toLowerCase().includes(query) ||
      (s.branch && s.branch.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending' || !s.status).length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  };

  const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    const hasTimezone = /Z|([+-]\d{2}:\d{2})$/.test(dateStr);
    if (!hasTimezone && dateStr.includes('T')) {
      return new Date(`${dateStr}+05:30`);
    }
    return new Date(dateStr);
  };

  const toLocalDateTimeString = (isoString) => {
    if (!isoString) return '';
    const parsedDate = parseDateSafe(isoString);
    if (!parsedDate || isNaN(parsedDate.getTime())) return '';
    const tzOffset = parsedDate.getTimezoneOffset() * 60000;
    return new Date(parsedDate.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="mb-6">
        <Link to="/admin/dashboard" className="text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-2 text-[13px] font-black uppercase tracking-widest mb-6 transition-colors group w-max">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-sm shrink-0">
              <Star size={32} className="fill-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Super 50 Cohort Selection</h1>
              <p className="text-[var(--text-secondary)] font-medium mt-2 max-w-2xl text-sm leading-relaxed">
                Review and approve student enrollment requests for the Super 50 cohort, manage availability schedules, or upload bulk select lists.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-light)] gap-8">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all relative ${activeTab === 'requests'
              ? 'text-[var(--primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
          Selection Requests & Control
          {activeTab === 'requests' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bulk-upload')}
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all relative ${activeTab === 'bulk-upload'
              ? 'text-[var(--primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
          Bulk Excel Upload
          {activeTab === 'bulk-upload' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)]" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'requests' ? (
          <motion.div
            key="requests-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-6 rounded-2xl border-[var(--border-light)]">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Total Requests</p>
                <p className="text-3xl font-display font-black text-[var(--text-primary)] mt-1">{stats.total}</p>
              </div>
              <div className="glass-card p-6 rounded-2xl border-[var(--border-light)] bg-amber-500/5 border-amber-500/20">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Pending Review</p>
                <p className="text-3xl font-display font-black text-amber-500 mt-1">{stats.pending}</p>
              </div>
              <div className="glass-card p-6 rounded-2xl border-[var(--border-light)] bg-emerald-500/5 border-emerald-500/20">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Approved</p>
                <p className="text-3xl font-display font-black text-emerald-500 mt-1">{stats.approved}</p>
              </div>
              <div className="glass-card p-6 rounded-2xl border-[var(--border-light)] bg-red-500/5 border-red-500/20">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Rejected</p>
                <p className="text-3xl font-display font-black text-red-500 mt-1">{stats.rejected}</p>
              </div>
            </div>

            {/* Form Settings Controls */}
            <div className="glass-card p-6 border-[var(--border-light)] rounded-3xl space-y-6">
              <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-4">
                <SettingsIcon size={18} className="text-[var(--primary)]" />
                <h2 className="text-lg font-display font-black text-[var(--text-primary)]">Registration Period Controls</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enable Switch */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Manual Toggle</p>
                  <div className="flex bg-[var(--bg-hover)] p-1 rounded-xl border border-[var(--border-light)] max-w-[140px]">
                    <button
                      onClick={() => saveFormSettings({ ...formSettings, formEnabled: true })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${formSettings.formEnabled
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-[var(--text-secondary)]'
                        }`}
                    >
                      ON
                    </button>
                    <button
                      onClick={() => saveFormSettings({ ...formSettings, formEnabled: false })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${!formSettings.formEnabled
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-[var(--text-secondary)]'
                        }`}
                    >
                      OFF
                    </button>
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Start DateTime</label>
                  <input
                    type="datetime-local"
                    value={toLocalDateTimeString(formSettings.startDate)}
                    onChange={(e) => saveFormSettings({ ...formSettings, startDate: e.target.value })}
                    className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">End DateTime</label>
                  <input
                    type="datetime-local"
                    value={toLocalDateTimeString(formSettings.endDate)}
                    onChange={(e) => saveFormSettings({ ...formSettings, endDate: e.target.value })}
                    className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Request Table Panel */}
            <div className="glass-card p-6 border-[var(--border-light)] rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  <List className="text-[var(--primary)]" size={18} />
                  <h3 className="text-lg font-display font-black text-[var(--text-primary)]">
                    Selection Requests List
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchSettingsAndSubmissions(false)}
                    className="btn-outline-premium text-xs px-3.5 py-2 flex items-center gap-1.5 rounded-xl"
                  >
                    <RefreshCw size={13} /> Sync List
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-semibold whitespace-nowrap"
                  >
                    <Download size={16} /> Export Excel
                  </button>
                  <button
                    onClick={handleBulkApprove}
                    disabled={submissions.filter(s => s.status === 'pending' || !s.status).length === 0}
                    className="btn-premium text-xs px-3.5 py-2 flex items-center gap-1.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <CheckCircle size={13} /> Bulk Approve
                  </button>
                  <button
                    onClick={handleClearSubmissions}
                    disabled={submissions.length === 0}
                    className="btn-danger text-xs px-3.5 py-2 flex items-center gap-1.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} /> Clear All
                  </button>
                </div>
              </div>

              {/* Table Search & Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3 text-[var(--text-secondary)]" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, enrollment number or branch..."
                    className="w-full bg-[var(--bg-input)] pl-10 pr-4 py-2.5 border border-[var(--border-light)] rounded-xl text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Filter size={15} className="text-[var(--text-secondary)] shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-2.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={36} className="animate-spin text-[var(--primary)]" />
                  <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Syncing submissions...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[var(--border-light)] rounded-2xl space-y-3 bg-black/10">
                  <AlertCircle size={40} className="mx-auto text-slate-500 opacity-60 animate-pulse" />
                  <h4 className="text-sm font-black text-[var(--text-primary)]">No registrations found</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto">
                    {submissions.length === 0
                      ? 'No students have submitted applications yet.'
                      : 'No records matched your search queries or active filters.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar border border-[var(--border-light)] rounded-2xl">
                  <table className="w-full border-collapse text-left text-xs font-medium">
                    <thead>
                      <tr className="border-b border-[var(--border-light)] text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] bg-[#111116]">
                        <th className="p-4">Student Info</th>
                        <th className="p-4">Branch & Section</th>
                        <th className="p-4">Mentor</th>
                        <th className="p-4">Mobile</th>
                        <th className="p-4">GitHub</th>
                        <th className="p-4">Certifications</th>
                        <th className="p-4">Skills</th>
                        <th className="p-4">Hackathon</th>
                        <th className="p-4">Selection status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((sub) => (
                        <tr key={sub.id || sub._id} className="border-b border-[var(--border-light)] hover:bg-white/5 transition-colors">
                          {/* Name & Enrollment */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-[var(--text-primary)]">{sub.fullName}</span>
                              <span className="text-[10px] font-black uppercase text-[var(--primary)] tracking-wide mt-0.5">{sub.enrollmentNumber}</span>
                              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">{sub.email}</span>
                            </div>
                          </td>
                          {/* Branch & Section */}
                          <td className="p-4">
                            <div className="flex flex-col text-[11px]">
                              <span className="text-[var(--text-primary)]">{sub.branch?.split(' ')[0]}</span>
                              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase mt-0.5">Section {sub.section}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {sub.mentor ? (
                              <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded border border-[var(--primary)]/20 whitespace-nowrap">
                                {sub.mentor.name || sub.mentor}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">Unassigned</span>
                            )}
                          </td>
                          {/* Mobile */}
                          <td className="p-4 text-[var(--text-secondary)] text-[11px] font-mono">{sub.mobileNumber}</td>
                          {/* GitHub */}
                          <td className="p-4">
                            {sub.githubProfile ? (
                              <a
                                href={sub.githubProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 hover:underline"
                              >
                                <Github size={12} /> View Github
                              </a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          {/* Certifications & Photos */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1 max-w-[160px]">
                              <span className="text-[var(--text-primary)] truncate" title={sub.certifications}>{sub.certifications || '-'}</span>
                              {sub.certificateImage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingImage(sub.certificateImage);
                                    setIsImageModalOpen(true);
                                  }}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 hover:underline font-black flex items-center gap-1 mt-0.5 justify-start text-left"
                                >
                                  <FileText size={11} /> View Photo
                                </button>
                              )}
                            </div>
                          </td>
                          {/* Skills */}
                          <td className="p-4 max-w-[150px] truncate text-[var(--text-secondary)]" title={sub.skills}>
                            {sub.skills || <span className="text-slate-600">-</span>}
                          </td>
                          {/* Hackathon */}
                          <td className="p-4">
                            {sub.hackathonParticipation === 'Yes' ? (
                              <div className="flex flex-col gap-1">
                                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-center w-max">Yes</span>
                                <span className="text-[10px] text-[var(--text-secondary)] italic truncate max-w-[120px]" title={sub.hackathonDetails}>{sub.hackathonDetails}</span>
                              </div>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md text-[9px] font-bold w-max">No</span>
                            )}
                          </td>
                          {/* Status Badge */}
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                sub.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                              {sub.status || 'pending'}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {(!sub.status || sub.status === 'pending') ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(sub._id || sub.id, 'approved')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm transition-all"
                                    title="Approve student registration"
                                  >
                                    <UserCheck size={11} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(sub._id || sub.id, 'rejected')}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm transition-all"
                                    title="Reject student registration"
                                  >
                                    <UserX size={11} /> Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(sub._id || sub.id, 'pending')}
                                  className="text-[10px] font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-lg transition-all"
                                >
                                  Reset Status
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="bulk-upload-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="space-y-8">
              <div className="bg-blue-500/10 border border-blue-500/20 shadow-sm rounded-[1.2rem] p-6 flex gap-4">
                <Info className="text-blue-500 shrink-0 animate-bounce" size={24} />
                <div className="text-[13px] text-[var(--text-primary)] leading-relaxed font-medium w-full">
                  <p className="font-black mb-2 uppercase tracking-widest text-[10px] text-blue-500">How bulk upload works</p>
                  Upload an Excel spreadsheet with student emails. The matched student user accounts will instantly be marked as Super 50, unlocking:
                  <ul className="list-disc list-inside mt-3 space-y-2 text-[var(--text-secondary)] mb-4">
                    <li>Exclusive Placement Drive dashboard routes</li>
                    <li>Premium Project Progress log trackers</li>
                    <li>Competitive Placement Ecosystem Leaderboard ranks</li>
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
                  className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-[var(--primary)] bg-purple-500/5' : 'border-[var(--border-light)] hover:border-[var(--primary-light)] bg-[var(--bg-input)]/50'
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
                  disabled={uploadLoading || !file}
                  className="btn-premium w-full py-4 text-sm flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {uploadLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  {uploadLoading ? 'Processing Selection...' : 'Apply Selection'}
                </button>
              </div>
            </div>

            <div>
              {uploadResult ? (
                <div className="glass-card border-[2px] border-emerald-500/30 shadow-sm rounded-3xl p-12 text-center space-y-8 bg-emerald-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-[40px] pointer-events-none"></div>

                  <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/30 shadow-sm relative z-10">
                    <CheckCircle size={48} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-black text-[var(--text-primary)]">Selection Updated!</h3>
                    <p className="text-[var(--text-secondary)] font-medium mt-3 text-lg">{uploadResult.message}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pt-4 relative z-10">
                    <div className="p-8 rounded-3xl bg-[var(--bg-select)] border border-[var(--border-light)] shadow-sm">
                      <div className="text-6xl font-display font-black text-[var(--text-primary)]">{uploadResult.data?.modifiedCount || 0}</div>
                      <div className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-2">Students Unlocked</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadResult(null)}
                    className="text-[var(--primary)] text-[13px] font-black uppercase tracking-widest hover:text-[var(--primary-dark)] transition-colors relative z-10"
                  >
                    Upload another list
                  </button>
                </div>
              ) : (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px] border-dashed rounded-3xl">
                  <div className="w-24 h-24 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-3xl flex items-center justify-center shadow-sm">
                    <Star size={48} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-[var(--text-primary)] mb-2">Waiting for data...</h3>
                    <p className="text-[14px] text-[var(--text-secondary)] font-medium max-w-sm mx-auto">Results of your Super 50 selection will appear here after a successful upload.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Image Popup Modal */}
      <AnimatePresence>
        {isImageModalOpen && viewingImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsImageModalOpen(false);
                setViewingImage('');
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-[#111116] border border-[var(--border-light)] rounded-2xl overflow-hidden z-10 flex flex-col p-4 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2 text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                <span>Certificate Photo Preview</span>
                <button
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setViewingImage('');
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <X size={14} /> Close
                </button>
              </div>
              <div className="flex justify-center items-center max-h-[70vh] overflow-hidden rounded-xl bg-black">
                <img src={viewingImage} alt="Uploaded Certificate" className="max-w-full max-h-[70vh] object-contain" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Super50SelectionPage;
