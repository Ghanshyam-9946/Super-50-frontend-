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
    {Icon && (
      <div className="empty-state-icon-wrap">
        <Icon className="empty-state-icon" strokeWidth={1.5} />
      </div>
    )}
    {title && <h5 className="text-base font-semibold text-slate-700 mb-1">{title}</h5>}
    {message && <p className="text-sm max-w-sm mx-auto">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Card wrapper
export const Card = ({ title, icon: Icon, action, children, className = '', noPadding = false }) => (
  <div className={cn('card', className)}>
    {(title || action) && (
      <div className="card-header justify-between">
        <span className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="card-icon">
              <Icon className="w-4 h-4" />
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        {action}
      </div>
    )}
    <div className={noPadding ? '' : 'card-body'}>{children}</div>
  </div>
);

// Stat card for dashboards
const STAT_COLORS = {
  primary: { tile: 'from-indigo-500 to-violet-600 shadow-indigo-500/30', glow: 'bg-indigo-400/15' },
  success: { tile: 'from-emerald-400 to-teal-600 shadow-emerald-500/30', glow: 'bg-emerald-400/15' },
  warning: { tile: 'from-amber-400 to-orange-500 shadow-amber-500/30', glow: 'bg-amber-400/15' },
  danger: { tile: 'from-rose-500 to-red-600 shadow-rose-500/30', glow: 'bg-rose-400/15' },
  info: { tile: 'from-sky-400 to-cyan-600 shadow-sky-500/30', glow: 'bg-sky-400/15' },
};

export const StatCard = ({ label, value, icon: Icon, color = 'primary', meta }) => {
  const c = STAT_COLORS[color] || STAT_COLORS.primary;
  return (
    <div className="card relative overflow-hidden p-4 sm:p-5 flex items-start justify-between gap-2 sm:gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className={cn('pointer-events-none absolute -right-8 -top-10 w-32 h-32 rounded-full blur-2xl', c.glow)} />
      <div className="relative min-w-0 flex-1">
        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-2 leading-tight">
          {label}
        </div>
        <p className="font-display text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight sm:leading-none break-words" title={typeof value === 'string' ? value : undefined}>{value}</p>
        {meta && <div className="text-xs text-slate-500 mt-2 truncate" title={typeof meta === 'string' ? meta : undefined}>{meta}</div>}
      </div>
      {Icon && (
        <div className={cn('relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-br shadow-lg', c.tile)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn('pms-modal bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 w-full max-h-[90vh] overflow-y-auto', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="sticky bottom-0 px-5 py-4 border-t border-slate-100 bg-slate-50/95 backdrop-blur flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

// Confirmation hook (using browser confirm wrapped consistently)
export const confirmAction = (message = 'Are you sure?') => window.confirm(message);
