import React from 'react';
import { Award, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function CertificateCard({ cert }) {
  const statusConfig = {
    approved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: CheckCircle2,
      label: 'Approved'
    },
    rejected: {
      bg: 'bg-red-50 text-red-700 border-red-200/60',
      icon: XCircle,
      label: 'Rejected'
    },
    pending: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
      icon: Clock,
      label: 'Pending'
    }
  };

  const config = statusConfig[cert.verified] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="glass p-5 rounded-2xl border border-slate-200/60 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
          <Award size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 text-sm leading-snug truncate" title={cert.title}>
            {cert.title}
          </h4>
          <p className="text-xs text-slate-500 mt-1 truncate" title={cert.issuedBy}>
            Issued by {cert.issuedBy}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg}`}>
          <StatusIcon size={12} />
          <span>{config.label}</span>
        </div>
      </div>
    </div>
  );
}
