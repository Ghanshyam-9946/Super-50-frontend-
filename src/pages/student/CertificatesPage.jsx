import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { fetchMyCertificates, uploadCertificate, deleteCertificate } from '../../features/certificates/certificatesSlice';
import { Award, Upload, Trash2, Eye, FileText, Image, Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function UploadModal({ onClose }) {
  const dispatch = useDispatch();
  const { uploading } = useSelector((s) => s.certificates);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', issuedBy: '' });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10485760,
    onDrop: (accepted) => setFile(accepted[0]),
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    const fd = new FormData();
    fd.append('certificate', file);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('issuedBy', form.issuedBy);
    const result = await dispatch(uploadCertificate(fd));
    if (!result.error) { toast.success('Certificate uploaded!'); onClose(); }
    else toast.error(result.payload);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card" style={{ width: '90%', maxWidth: 520, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Upload Certificate</h2>
        <form onSubmit={handleSubmit}>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
            <input {...getInputProps()} />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                {file.type === 'application/pdf' ? <FileText size={24} color="var(--accent)" /> : <Image size={24} color="var(--accent)" />}
                <span style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</span>
              </div>
            ) : (
              <>
                <Upload size={32} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                <p style={{ fontWeight: 600 }}>{isDragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF or Image (max 10MB)</p>
              </>
            )}
          </div>
          {['title', 'issuedBy', 'description'].map((field) => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                {field === 'title' ? 'Title *' : field === 'issuedBy' ? 'Issued By' : 'Description'}
              </label>
              <input className="input-field" value={form[field]}
                placeholder={field === 'title' ? 'e.g., AWS Cloud Practitioner' : ''}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === 'title'} id={`cert-${field}`} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={uploading} id="cert-upload-submit">
            {uploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Upload size={16} /> Upload</>}
          </button>
        </form>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CertificatesPage() {
  const dispatch = useDispatch();
  const { myCertificates, loading } = useSelector((s) => s.certificates);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { dispatch(fetchMyCertificates()); }, [dispatch]);

  const filtered = filter === 'all' ? myCertificates : myCertificates.filter((c) => c.verified === filter);

  return (
    <div className="page-layout">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Certificates</h1>
          <p className="page-subtitle">Upload and track your certificates</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="open-upload-modal">
          <Plus size={16} /> Upload Certificate
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: filter === f ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
            color: filter === f ? 'var(--accent-light)' : 'var(--text-muted)', transition: 'all 0.2s',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Award size={60} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No certificates found</p>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }}>
            <Upload size={15} /> Upload First Certificate
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <AnimatePresence>
            {filtered.map((cert, i) => (
              <motion.div key={cert._id} className="glass-card" style={{ padding: 20 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cert.fileType === 'pdf' ? <FileText size={22} color="var(--accent)" /> : <Image size={22} color="var(--accent)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cert.title}</div>
                    {cert.issuedBy && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{cert.issuedBy}</div>}
                    <span className={`badge badge-${cert.verified}`}>
                      {cert.verified === 'approved' ? '✓ Approved' : cert.verified === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
                {cert.verified === 'rejected' && cert.rejectionReason && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 8, fontSize: 12, color: 'var(--danger)' }}>
                    Reason: {cert.rejectionReason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}>
                    <Eye size={13} /> View
                  </a>
                  {cert.verified !== 'approved' && (
                    <button onClick={() => dispatch(deleteCertificate(cert._id)).then(r => !r.error && toast.success('Deleted'))}
                      className="btn-danger" style={{ fontSize: 12, padding: '7px 12px' }} id={`delete-cert-${cert._id}`}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(cert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
