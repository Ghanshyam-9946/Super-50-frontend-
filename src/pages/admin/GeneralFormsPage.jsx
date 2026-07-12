import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Layers,
  FileText,
  RefreshCw,
  XCircle,
  Eye,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function GeneralFormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    purpose: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const fetchForms = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/general-forms/admin');
      setForms(res.data.data);
    } catch (err) {
      toast.error('Failed to load forms');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newForm.purpose.trim()) {
      return toast.error('Please enter a purpose/title');
    }
    const toastId = toast.loading('Creating form...');
    try {
      await api.post('/general-forms', newForm);
      toast.success('Generalised form created successfully!', { id: toastId });
      setIsCreateOpen(false);
      setNewForm({ purpose: '', description: '', startDate: '', endDate: '' });
      fetchForms(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create form', { id: toastId });
    }
  };

  const handleToggleStatus = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/general-forms/${id}/toggle`);
      toast.success(res.data.message);
      setForms(prev => prev.map(f => f._id === id ? res.data.data : f));
    } catch (err) {
      toast.error('Failed to update form status');
    }
  };

  const handleDeleteForm = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this form and all its submissions? This cannot be undone.')) {
      try {
        await api.delete(`/general-forms/${id}`);
        toast.success('Form deleted successfully');
        setForms(prev => prev.filter(f => f._id !== id));
      } catch (err) {
        toast.error('Failed to delete form');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[var(--primary)] text-[11px] font-black uppercase tracking-widest w-max mb-2 shadow-sm">
            <Layers size={14} />
            <span>General Purpose Forms</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Generalised Forms Manager
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">
            Create, manage and view submissions for all dynamic event registration forms.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-premium flex items-center gap-2 self-start md:self-center py-3 px-6 rounded-xl text-sm"
        >
          <Plus size={16} /> Create General Form
        </button>
      </header>

      {/* Forms List Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-display font-black text-[var(--text-primary)] flex items-center gap-2 px-1">
          <List size={18} /> Active & Configured Forms ({forms.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-[var(--primary)]" size={36} />
          </div>
        ) : forms.length === 0 ? (
          <div className="glass-card p-16 text-center text-[var(--text-secondary)] font-medium">
            <FileText className="mx-auto mb-4 opacity-45" size={48} />
            <h3 className="text-xl font-display font-black text-[var(--text-primary)]">No forms found</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Click "Create General Form" to set up your first registration event.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
              <div
                key={form._id}
                onClick={() => navigate(`/admin/general-forms/${form._id}`)}
                className="glass-card p-6 border border-[var(--border-light)] hover:border-[var(--primary)]/50 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-[var(--shadow-hover)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center font-black">
                      <FileText size={20} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                      form.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-lg text-[var(--text-primary)] mt-4 leading-tight group-hover:text-[var(--primary)] transition-colors">
                    {form.purpose}
                  </h3>
                  {form.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-3 leading-relaxed">
                      {form.description}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-1.5 text-[11px] text-[var(--text-secondary)] font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-purple-400" />
                      <span>Start: {form.startDate ? new Date(form.startDate).toLocaleDateString() : 'Immediate'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-amber-400" />
                      <span>End: {form.endDate ? new Date(form.endDate).toLocaleDateString() : 'No Deadline'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[var(--border-light)] flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleToggleStatus(form._id, e)}
                      className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1.5 rounded-lg border ${
                        form.isActive ? 'bg-amber-500/5 text-amber-500 border-amber-500/20 hover:bg-amber-500/10' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                      }`}
                    >
                      {form.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={(e) => handleDeleteForm(form._id, e)}
                      className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1.5 rounded-lg bg-red-500/5 text-red-500 border border-red-500/20 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <Eye size={12} /> View Registrations
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[var(--bg-modal)] border border-[var(--border-light)] rounded-3xl shadow-xl w-full max-w-lg p-8 relative"
            >
              <button
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors"
              >
                <XCircle size={18} />
              </button>

              <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-1">Create Generalised Form</h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-6">Set up a simple registration form with custom purpose and date limits.</p>

              <form onSubmit={handleCreateForm} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Purpose / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dance Club Auditions, Tech Fest Feedback"
                    value={newForm.purpose}
                    onChange={(e) => setNewForm({ ...newForm, purpose: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description (Optional)</label>
                  <textarea
                    placeholder="Brief details about the registration..."
                    value={newForm.description}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                    rows={3}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Start Date & Time (Optional)</label>
                    <input
                      type="datetime-local"
                      value={newForm.startDate}
                      onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">End Date & Time (Optional)</label>
                    <input
                      type="datetime-local"
                      value={newForm.endDate}
                      onChange={(e) => setNewForm({ ...newForm, endDate: e.target.value })}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-premium w-full py-3.5 mt-6 flex items-center justify-center gap-2">
                  Create Form
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
