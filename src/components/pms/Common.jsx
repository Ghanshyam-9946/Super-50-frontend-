import { cn } from '../../utils/pms/helpers';

// Loading spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg
      className={cn('animate-spin text-brand-600', sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  );
};

// Full-page loader
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Spinner size="lg" />
  </div>
);

// Empty state
export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="empty-state">
    {Icon && <Icon className="empty-state-icon" strokeWidth={1.5} />}
    {title && <h5 className="text-base font-medium text-slate-700 mb-1">{title}</h5>}
    {message && <p className="text-sm">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Card wrapper
export const Card = ({ title, icon: Icon, action, children, className = '', noPadding = false }) => (
  <div className={cn('card', className)}>
    {(title || action) && (
      <div className="card-header justify-between">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-brand-600" />}
          {title}
        </span>
        {action}
      </div>
    )}
    <div className={noPadding ? '' : 'card-body'}>{children}</div>
  </div>
);

// Stat card for dashboards
export const StatCard = ({ label, value, icon: Icon, color = 'primary', meta }) => {
  const colors = {
    primary: 'bg-brand-100 text-brand-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-cyan-100 text-cyan-700',
  };
  return (
    <div className="card p-5 flex items-start justify-between gap-3 hover:shadow-card transition-shadow">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {label}
        </div>
        <p className="text-3xl font-bold text-slate-900 leading-none truncate">{value}</p>
        {meta && <div className="text-xs text-slate-500 mt-2">{meta}</div>}
      </div>
      {Icon && (
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

// Badge by status
export const StatusBadge = ({ status }) => {
  const map = {
    accepted: 'badge-success',
    rejected: 'badge-danger',
    pending: 'badge-warning',
    locked: 'badge-secondary',
    not_submitted: 'badge-secondary',
    present: 'badge-success',
    absent: 'badge-danger',
    late: 'badge-warning',
  };
  const cls = map[status?.toLowerCase()] || 'badge-secondary';
  const label = (status || '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={cls}>{label}</span>;
};

// Modal wrapper
export const Modal = ({ open, onClose, title, children, size = 'md', footer }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn('bg-white rounded-xl shadow-elevated w-full max-h-[90vh] overflow-y-auto', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

// Confirmation hook (using browser confirm wrapped consistently)
export const confirmAction = (message = 'Are you sure?') => window.confirm(message);
