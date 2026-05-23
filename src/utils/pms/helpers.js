// Format date for display
export const formatDate = (dateStr, opts = {}) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Days from today
export const isPastDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d <= today;
};

// Get initial letter for avatar
export const getInitial = (name) => {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
};

// Convert object to CSV download
export const downloadCSV = (rows, headers, filename) => {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }
  const csvRows = [headers.join(',')];
  rows.forEach((r) => {
    csvRows.push(
      Object.values(r)
        .map((v) => {
          const val = v === null || v === undefined ? '' : String(v);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'export.csv';
  link.click();
  URL.revokeObjectURL(url);
};

// Project mapping helpers
export const semesterToProject = (sem) => {
  const map = { 5: 'Minor-1', 6: 'Minor-2', 7: 'Major-1', 8: 'Major-2' };
  return map[Number(sem)] || '—';
};

// Class joiner
export const cn = (...classes) => classes.filter(Boolean).join(' ');
