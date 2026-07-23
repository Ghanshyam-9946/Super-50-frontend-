import React from 'react';
import { Award, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function CertificateCard({ cert }) {
  const statusConfig = {
    approved: {
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: CheckCircle2,
      label: 'Approved'
    },
    rejected: {
      bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      icon: XCircle,
      label: 'Rejected'
    },
    pending: {
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: Clock,
      label: 'Pending'
    }
  };

  const config = statusConfig[cert.verified] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="glass-card p-6 flex flex-col justify-between gap-5 group cursor-default">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-50 text-[var(--primary)] rounded-2xl border border-purple-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <Award size={24} className="group-hover:fill-purple-100 transition-colors" />
        </div>
        <div className="flex-1 min-w-0 mt-0.5">
          <h4 className="font-bold text-[var(--text-primary)] text-[15px] leading-snug truncate group-hover:text-[var(--primary)] transition-colors" title={cert.title}>
            {cert.title}
          </h4>
          <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-1 truncate" title={cert.issuedBy}>
            {cert.issuedBy}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-[var(--border-light)]">
        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-70">Status</span>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${config.bg}`}>
          <StatusIcon size={14} />
          <span>{config.label}</span>
        </div>
      </div>
    </div>
  );
}
