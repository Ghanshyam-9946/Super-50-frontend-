import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPendingCertificates, verifyCertificate } from '../../features/certificates/certificatesSlice';
import { ShieldCheck, Eye, FileText, Image, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function RejectModal({ cert, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-white border border-slate-200 shadow-xl rounded-[1.5rem]" style={{ width: '90%', maxWidth: 420, padding: 28 }}>
        <h3 className="text-xl font-display font-black text-red-600 mb-2">Reject Certificate</h3>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">
          Rejecting: <strong className="text-[var(--text-primary)]">{cert.title}</strong>
        </p>
        <textarea 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
          style={{ minHeight: 90, resize: 'vertical' }}
          placeholder="Reason for rejection (optional but helpful for student)..."
          value={reason} onChange={(e) => setReason(e.target.value)} id="reject-reason" />
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 py-3 rounded-xl text-[13px] font-bold transition-colors" onClick={onClose}>Cancel</button>
          <button className="flex-1 bg-red-500 text-white hover:bg-red-600 py-3 rounded-xl text-[13px] font-bold transition-colors shadow-sm shadow-red-500/20 flex items-center justify-center gap-2"
            onClick={async () => { setLoading(true); await onConfirm(reason); setLoading(false); }}
            disabled={loading} id="confirm-reject">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Reject
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyCertificatesPage() {
  const dispatch = useDispatch();
  const { pendingCertificates, loading } = useSelector((s) => s.certificates);
  const [rejectModal, setRejectModal] = useState(null);
  const [processing, setProcessing] = useState({});

  useEffect(() => { dispatch(fetchPendingCertificates()); }, [dispatch]);

  const handleApprove = async (id) => {
    setProcessing((p) => ({ ...p, [id]: 'approve' }));
    const result = await dispatch(verifyCertificate({ id, action: 'approve' }));
    setProcessing((p) => ({ ...p, [id]: null }));
    if (!result.error) toast.success('Certificate approved! Student score updated.');
    else toast.error(result.payload);
  };

  const handleReject = async (cert, reason) => {
    const result = await dispatch(verifyCertificate({ id: cert._id, action: 'reject', rejectionReason: reason }));
    setRejectModal(null);
    if (!result.error) toast.success('Certificate rejected.');
    else toast.error(result.payload);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-200 shadow-sm shrink-0">
              <ShieldCheck size={32} />
            </div>
            Verify Certificates
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">{pendingCertificates.length} certificates awaiting your review and approval.</p>
        </motion.div>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-[1.2rem] h-[160px]" />)}
        </div>
      ) : pendingCertificates.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed">
          <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShieldCheck size={48} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-display font-black text-[var(--text-primary)] mb-2">All caught up! 🎉</h3>
          <p className="text-[var(--text-secondary)] font-medium">There are no pending certificates to review at this moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <AnimatePresence>
            {pendingCertificates.map((cert, i) => (
              <motion.div key={cert._id} className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start hover:border-[var(--primary)] transition-all group"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }} transition={{ delay: i * 0.05 }}>
                
                {/* File icon */}
                <div className="w-16 h-16 rounded-[1.2rem] bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                  {cert.fileType === 'pdf' ? <FileText size={32} className="text-amber-500" /> : <Image size={32} className="text-amber-500" />}
                </div>

                {/* Info */}
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-display font-black text-xl text-[var(--text-primary)] mb-1">{cert.title}</div>
                      {cert.description && <div className="text-[13px] font-medium text-[var(--text-secondary)] mb-2">{cert.description}</div>}
                      {cert.issuedBy && <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Issued by: <strong className="text-slate-600">{cert.issuedBy}</strong></div>}
                    </div>
                    <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] px-3 py-1.5 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5 w-max">
                      <Loader2 size={12} className="animate-spin" /> Pending
                    </span>
                  </div>

                  {/* Student info */}
                  <div className="mt-4 p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-light)] grid grid-cols-2 md:grid-cols-4 gap-4 shadow-inner-sm">
                    <div>
                      <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80 mb-1">Student</div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{cert.studentId?.name}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80 mb-1">Enrollment</div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{cert.studentId?.enrollmentNumber}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80 mb-1">Department</div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{cert.studentId?.department}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-80 mb-1">Uploaded</div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)] truncate">{new Date(cert.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 mt-6">
                    <a href={cert.fileUrl} target="_blank" rel="noreferrer"
                      className="btn-outline-premium py-2.5 px-4 flex items-center gap-2 text-xs">
                      <Eye size={14} /> View Certificate
                    </a>
                    <button className="btn-success py-2.5 px-4 flex items-center gap-2 text-xs"
                      onClick={() => handleApprove(cert._id)} disabled={!!processing[cert._id]}
                      id={`approve-${cert._id}`}>
                      {processing[cert._id] === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve & Add Points
                    </button>
                    <button className="btn-danger py-2.5 px-4 flex items-center gap-2 text-xs"
                      onClick={() => setRejectModal(cert)} id={`reject-${cert._id}`}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {rejectModal && (
        <RejectModal cert={rejectModal} onClose={() => setRejectModal(null)}
          onConfirm={(reason) => handleReject(rejectModal, reason)} />
      )}
    </div>
  );
}
