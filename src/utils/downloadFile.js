import api from "../services/api";

// Fetches a protected file endpoint through the shared axios instance (so
// the Bearer token from localStorage actually goes out) and saves it via a
// same-origin blob URL. A plain `<a href={apiUrl} download>` doesn't work
// for cross-origin/protected endpoints — the browser sends no auth header
// on a bare navigation, and `download` is silently ignored cross-origin
// anyway. Mirrors the pattern already proven in Master Data's
// AllocationSheet.jsx/LoadCalculation.jsx.
export const downloadFile = async (url, filename) => {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};
