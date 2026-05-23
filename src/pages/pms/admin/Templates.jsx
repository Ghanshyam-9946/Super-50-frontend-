import { useState, useEffect, useRef } from 'react';
import {
  FolderOpen, Upload, FileText, Trash2, Edit3, Eye, EyeOff, Download,
  Plus, Presentation, FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner, EmptyState, Modal, confirmAction } from '../../../components/pms/Common';
import { formatDate } from '../../../utils/pms/helpers';

const CATEGORIES = ['Report Format', 'PPT Format', 'Synopsis Format', 'Other'];

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

// =========== UPLOAD MODAL ===========
const UploadModal = ({ open, onClose, onUploaded }) => {
  const fileRef = useRef();
  const [form, setForm] = useState({ title: '', description: '', category: 'Report Format' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Select a file first');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      await adminAPI.uploadTemplate(fd);
      toast.success('Template uploaded');
      onUploaded();
      setForm({ title: '', description: '', category: 'Report Format' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Template"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !file} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Minor Project Report Format 2025"
            required
          />
        </div>
        <div>
          <label className="form-label">Category *</label>
          <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows="2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description (optional)"
          />
        </div>
        <div>
          <label className="form-label">File *</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.md"
            className="form-input"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          <p className="form-help">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, TXT, MD · Max 50 MB</p>
        </div>
      </form>
    </Modal>
  );
};

// =========== EDIT MODAL ===========
const EditModal = ({ open, onClose, template, onSaved }) => {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setForm({
        title: template.title || '',
        description: template.description || '',
        category: template.category || 'Other',
        isActive: template.isActive !== false,
      });
    }
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.updateTemplate(template._id, form);
      toast.success('Updated');
      onSaved();
      onClose();
    } catch (err) { toast.error(handleError(err)); }
    finally { setSubmitting(false); }
  };

  if (!template) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Template"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="text-white" /> : 'Save'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="form-label">Title</label>
          <input className="form-input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category || 'Other'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="2" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            checked={form.isActive !== false}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Visible to students
        </label>
      </form>
    </Modal>
  );
};

// =========== MAIN PAGE ===========
const AdminTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTpl, setEditTpl] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listTemplates();
      setTemplates(res.data.templates);
    } catch (err) { toast.error(handleError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (t) => {
    if (!confirmAction(`Delete template "${t.title}"? File will be permanently removed.`)) return;
    try {
      await adminAPI.deleteTemplate(t._id);
      toast.success('Deleted');
      fetchData();
    } catch (err) { toast.error(handleError(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resources & Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Upload report formats, PPT templates, and other resources for students to download.</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Upload Template
        </button>
      </div>

      <Card title={<>All Templates <span className="badge-secondary ml-1">{templates.length}</span></>} icon={FolderOpen} noPadding>
        {loading ? <div className="py-10 flex justify-center"><Spinner /></div>
          : templates.length === 0 ? <EmptyState icon={FolderOpen} title="No templates uploaded" message="Click 'Upload Template' to add your first one." />
          : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Title</th><th>Category</th><th>File</th><th>Size</th><th>Downloads</th><th>Status</th><th>Uploaded</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div className="font-semibold">{t.title}</div>
                        {t.description && <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</div>}
                      </td>
                      <td><span className="badge-info">{t.category}</span></td>
                      <td className="text-xs font-mono text-slate-500 truncate max-w-[180px]" title={t.originalName}>{t.originalName}</td>
                      <td className="text-sm">{formatBytes(t.size)}</td>
                      <td><span className="badge-secondary">{t.downloadCount || 0}</span></td>
                      <td>
                        {t.isActive
                          ? <span className="badge-success"><Eye className="w-3 h-3" /> Visible</span>
                          : <span className="badge-secondary"><EyeOff className="w-3 h-3" /> Hidden</span>}
                      </td>
                      <td className="text-sm">{formatDate(t.createdAt)}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <a
                            href={adminAPI.templateDownloadUrl(t._id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-outline btn-sm"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                          <button onClick={() => setEditTpl(t)} className="btn-secondary btn-sm">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(t)} className="btn-secondary btn-sm text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={fetchData} />
      <EditModal open={!!editTpl} onClose={() => setEditTpl(null)} template={editTpl} onSaved={fetchData} />
    </div>
  );
};

export default AdminTemplates;
