// Where an uploaded file lives. Cloud uploads are stored as absolute URLs;
// files uploaded before the move to cloud storage are just a name (or a
// /uploads/... path) served by our own backend.
export const getFileUrl = (value, folder = '') => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/uploads/') ? value : `/uploads/${folder}/${value}`;
  return getImageUrl(path);
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // If it's a relative path (like /uploads/profiles/...)
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${path}`;
};
