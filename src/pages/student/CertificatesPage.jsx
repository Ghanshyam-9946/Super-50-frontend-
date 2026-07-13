import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { fetchMyCertificates, uploadCertificate, deleteCertificate } from '../../features/certificates/certificatesSlice';
import { Award, Upload, Trash2, Eye, FileText, Image, Plus, X, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

function UploadModal({ onClose }) {
  const dispatch = useDispatch();
  const { uploading } = useSelector((s) => s.certificates);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', issuedBy: '' });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 100 * 1024,
    onDrop: (accepted, rejected) => {
      if (rejected && rejected.length > 0) {
        toast.error('File size exceeds the 100KB limit!');
        return;
      }
      setFile(accepted[0]);
    },
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-[var(--border-light)] shadow-xl rounded-[1.5rem] relative" style={{ width: '90%', maxWidth: 520, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-50 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100 mb-4 shadow-sm">
          <Award size={24} />
        </div>
        <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-6">Upload Certificate</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer mb-6 ${
            isDragActive ? 'border-[var(--primary)] bg-purple-50/50' : 'border-slate-200 hover:border-[var(--primary-light)] bg-slate-50/30'
          }`}>
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-2 border border-orange-100 shadow-sm">
                  {file.type === 'application/pdf' ? <FileText size={32} className="text-orange-500 mx-auto" /> : <Image size={32} className="text-orange-500 mx-auto" />}
                </div>
                <p className="font-display font-black text-lg text-[var(--text-primary)]">{file.name}</p>
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-sm">
                  <Upload size={32} className="text-slate-400" />
                </div>
                <p className="text-[var(--text-primary)] font-display font-black text-xl">{isDragActive ? 'Drop here!' : 'Drag & drop file here'}</p>
                <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-widest font-black">PDF or Image (max 100KB)</p>
              </div>
            )}
          </div>
          
          {['title', 'issuedBy', 'description'].map((field) => (
            <div key={field}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                {field === 'title' ? 'Title *' : field === 'issuedBy' ? 'Issued By' : 'Description'}
              </label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                value={form[field]}
                placeholder={field === 'title' ? 'e.g., AWS Cloud Practitioner' : ''}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === 'title'} id={`cert-${field}`} 
              />
            </div>
          ))}
          <button type="submit" className="btn-premium w-full py-3.5 mt-6 flex items-center justify-center gap-2" disabled={uploading} id="cert-upload-submit">
            {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : <><Upload size={18} /> Upload Certificate</>}
          </button>
        </form>
      </motion.div>
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-200 shadow-sm shrink-0">
              <Award size={32} />
            </div>
            My Certificates
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Upload and track your verified certificates and achievements.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <button className="btn-premium flex items-center gap-2 px-6 py-3" onClick={() => setShowModal(true)} id="open-upload-modal">
            <Plus size={18} /> Upload Certificate
          </button>
        </motion.div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} 
            className={`px-5 py-2.5 rounded-[1.2rem] text-[12px] font-black uppercase tracking-widest transition-all border ${
              filter === f 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-purple-500/20' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'
            }`}>
            {f === 'all' ? 'All Certificates' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-[1.2rem] h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed">
          <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Award size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-display font-black text-[var(--text-primary)] mb-2">No certificates found</h3>
          <p className="text-[var(--text-secondary)] font-medium mb-8">You haven't uploaded any certificates matching this filter yet.</p>
          <button className="btn-premium flex items-center gap-2 px-6 py-3 mx-auto" onClick={() => setShowModal(true)}>
            <Upload size={18} /> Upload First Certificate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((cert, i) => (
              <motion.div key={cert._id} className="glass-card p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-colors group relative overflow-hidden h-full"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 shadow-sm">
                    {cert.fileType === 'pdf' ? <FileText size={24} className="text-orange-500" /> : <Image size={24} className="text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="font-display font-black text-lg text-[var(--text-primary)] mb-1 leading-tight line-clamp-2">{cert.title}</div>
                    {cert.issuedBy && <div className="text-[12px] font-bold text-slate-500 mb-2 truncate">{cert.issuedBy}</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm ${
                    cert.verified === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                    cert.verified === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' : 
                    'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {cert.verified === 'approved' ? <><ShieldCheck size={12} /> Approved</> : 
                     cert.verified === 'rejected' ? <><ShieldAlert size={12} /> Rejected</> : 
                     <><Loader2 size={12} className="animate-spin" /> Pending</>}
                  </span>
                </div>

                {cert.verified === 'rejected' && cert.rejectionReason && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-[12px] font-medium text-red-800 shadow-inner-sm">
                    <strong className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">Reason for Rejection</strong>
                    {cert.rejectionReason}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-[var(--border-light)] flex gap-3">
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="btn-outline-premium flex-1 flex items-center justify-center gap-2 py-2.5 text-xs">
                    <Eye size={14} /> View
                  </a>
                  {cert.verified !== 'approved' && (
                    <button onClick={() => dispatch(deleteCertificate(cert._id)).then(r => !r.error && toast.success('Deleted'))}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[0.8rem] transition-colors border border-transparent hover:border-red-200 shadow-sm" id={`delete-cert-${cert._id}`} title="Delete Certificate">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="absolute top-4 right-5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {new Date(cert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
