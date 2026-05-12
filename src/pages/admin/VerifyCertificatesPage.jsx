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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass-card" style={{ width: '90%', maxWidth: 420, padding: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--danger)' }}>Reject Certificate</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Rejecting: <strong style={{ color: 'var(--text-primary)' }}>{cert.title}</strong>
        </p>
        <textarea className="input-field" style={{ minHeight: 90, resize: 'vertical' }}
          placeholder="Reason for rejection (optional but helpful for student)..."
          value={reason} onChange={(e) => setReason(e.target.value)} id="reject-reason" />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
          <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}
            onClick={async () => { setLoading(true); await onConfirm(reason); setLoading(false); }}
            disabled={loading} id="confirm-reject">
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={14} />} Reject
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <div className="page-layout">
      <div className="page-header">
        <h1 className="page-title">
          <ShieldCheck size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10, color: '#f59e0b' }} />
          Verify Certificates
        </h1>
        <p className="page-subtitle">{pendingCertificates.length} certificates awaiting review</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : pendingCertificates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <ShieldCheck size={64} style={{ color: '#10b981', opacity: 0.4, marginBottom: 16 }} />
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>All caught up! 🎉</p>
          <p style={{ color: 'var(--text-muted)' }}>No pending certificates to review</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence>
            {pendingCertificates.map((cert, i) => (
              <motion.div key={cert._id} className="glass-card" style={{ padding: 22 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }} transition={{ delay: i * 0.05 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* File icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cert.fileType === 'pdf' ? <FileText size={26} color="#f59e0b" /> : <Image size={26} color="#f59e0b" />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{cert.title}</div>
                        {cert.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{cert.description}</div>}
                        {cert.issuedBy && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Issued by: <strong>{cert.issuedBy}</strong></div>}
                      </div>
                      <span className="badge badge-pending">⏳ Pending</span>
                    </div>

                    {/* Student info */}
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{cert.studentId?.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrollment</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{cert.studentId?.enrollmentNumber}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{cert.studentId?.department}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uploaded</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(cert.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <a href={cert.fileUrl} target="_blank" rel="noreferrer"
                        className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
                        <Eye size={14} /> View Certificate
                      </a>
                      <button className="btn-success" style={{ fontSize: 13, padding: '8px 16px' }}
                        onClick={() => handleApprove(cert._id)} disabled={!!processing[cert._id]}
                        id={`approve-${cert._id}`}>
                        {processing[cert._id] === 'approve' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />} Approve
                      </button>
                      <button className="btn-danger" style={{ fontSize: 13, padding: '8px 16px' }}
                        onClick={() => setRejectModal(cert)} id={`reject-${cert._id}`}>
                        <X size={14} /> Reject
                      </button>
                    </div>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
