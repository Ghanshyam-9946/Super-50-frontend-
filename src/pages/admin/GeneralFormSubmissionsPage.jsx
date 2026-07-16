import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Download,
  Search,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  User
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function GeneralFormSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchDetailsAndSubmissions = async () => {
    setLoading(true);
    try {
      // Get submissions
      const submissionsRes = await api.get(`/general-forms/${id}/submissions`);
      setSubmissions(submissionsRes.data.data);

      // Get forms list to find current form details (or fetch from forms list)
      const formsRes = await api.get('/general-forms/admin');
      const currentForm = formsRes.data.data.find(f => f._id === id);
      if (currentForm) {
        setForm(currentForm);
      } else {
        toast.error('Form not found');
        navigate('/admin/general-forms');
      }
    } catch (err) {
      toast.error('Failed to load submissions');
      navigate('/admin/general-forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailsAndSubmissions();
  }, [id]);

  const exportToExcel = () => {
    if (submissions.length === 0) {
      toast.error('No submissions to export');
      return;
    }
    const data = submissions.map((s, idx) => {
      const row = {
        'S.No': idx + 1,
        'Full Name': s.fullName,
        'Enrollment Number': s.enrollmentNumber,
        'Email Address': s.email,
        'Submitted At': new Date(s.createdAt).toLocaleString()
      };
      if (form && form.fields) {
        form.fields.forEach(field => {
          const val = s.responses?.[field.label] || s.responses?.get?.(field.label);
          row[field.label] = Array.isArray(val) ? val.join(', ') : (val || '');
        });
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, `${form.purpose.replace(/\s+/g, '_')}_submissions.xlsx`);
    toast.success('Exported successfully!');
  };

  const filteredSubmissions = submissions.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-[var(--primary)]" size={36} />
        <p className="text-[var(--text-secondary)] font-medium">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Back to forms link */}
      <Link 
        to="/admin/general-forms" 
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Forms Manager
      </Link>

      {/* Header */}
      {form && (
        <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[var(--primary)] text-[11px] font-black uppercase tracking-widest w-max mb-2 shadow-sm">
              <Layers size={14} />
              <span>Registrations for {form.purpose}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
              {form.purpose}
            </h1>
            <p className="text-[var(--text-secondary)] font-medium mt-1">
              {form.description || 'No description provided.'}
            </p>
          </div>
          
          <button
            onClick={exportToExcel}
            disabled={submissions.length === 0}
            className="btn-premium flex items-center gap-2 self-start md:self-center py-3 px-6 rounded-xl text-sm"
          >
            <Download size={16} /> Export Submissions ({submissions.length})
          </button>
        </header>
      )}

      {/* Submissions Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, enrollment or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-sm"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-black uppercase tracking-wider">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </p>
        </div>

        {/* Submissions Table */}
        <div className="glass-card overflow-hidden shadow-sm">
          {submissions.length === 0 ? (
            <div className="py-20 text-center text-[var(--text-secondary)] font-medium">
              <FileText className="mx-auto mb-4 opacity-40 text-slate-400 animate-pulse" size={48} />
              <p className="font-bold uppercase tracking-widest text-[11px]">No registered students yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
                <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
                  <tr>
                    <th className="px-6 py-4">S.No</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Enrollment Number</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Registration Time</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {filteredSubmissions.map((sub, idx) => (
                    <tr key={sub._id} className="hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)] font-bold">
                      <td className="px-6 py-4 font-normal text-xs text-[var(--text-secondary)]">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black text-xs uppercase">
                            {sub.fullName?.[0]}
                          </div>
                          <span>{sub.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 uppercase tracking-wider">{sub.enrollmentNumber}</td>
                      <td className="px-6 py-4 font-normal text-xs text-[var(--text-secondary)]">{sub.email}</td>
                      <td className="px-6 py-4 font-normal text-xs text-[var(--text-secondary)]">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                        >
                          View Response
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Response Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-modal)] border border-[var(--border-light)] rounded-3xl shadow-xl w-full max-w-lg p-8 relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedSubmission(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors"
              >
                <ArrowLeft size={18} className="rotate-90" />
              </button>

              <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-1">Student Response</h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-6">
                Submission detail for: <strong className="text-[var(--text-primary)]">{form?.purpose}</strong>
              </p>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Full Name</span>
                      <span className="text-slate-800">{selectedSubmission.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Enrollment Number</span>
                      <span className="text-slate-800 uppercase">{selectedSubmission.enrollmentNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block uppercase">Email Address</span>
                      <span className="text-slate-800 font-normal">{selectedSubmission.email}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Questions */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Custom Questions responses</h3>
                  {form?.fields && form.fields.map((field) => {
                    const ans = selectedSubmission.responses?.[field.label] || selectedSubmission.responses?.[field.label];
                    return (
                      <div key={field._id} className="border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 block mb-1">{field.label}</span>
                        <span className="text-sm font-bold text-slate-900 leading-relaxed">
                          {Array.isArray(ans) ? ans.join(', ') : (ans || <span className="text-slate-400 font-normal italic">No Response</span>)}
                        </span>
                      </div>
                    );
                  })}
                  {(!form?.fields || form.fields.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No custom fields were configured for this form.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
