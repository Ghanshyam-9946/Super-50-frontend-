import { getImageUrl } from './imageUrl';

// Which file an academic calendar record points at, and what kind — the
// original Excel/PDF as uploaded (`fileUrl`), or `pdfUrl` on records from
// before that field existed (those were always PDFs). null = no file at all
// (old records that only ever stored parsed calendar entries).
export const calendarFile = (cal) => {
  if (!cal) return null;
  if (cal.fileUrl) {
    return { url: cal.fileUrl, name: cal.fileName || 'Academic-Calendar', type: cal.fileType === 'pdf' ? 'pdf' : 'excel' };
  }
  if (cal.pdfUrl) return { url: cal.pdfUrl, name: cal.pdfFileName || 'Academic-Calendar.pdf', type: 'pdf' };
  return null;
};

// Saves the original file. A plain <a download> is ignored cross-origin, so
// fetch it and save via a same-origin blob URL. Checks the response (so an
// error page is never saved as "calendar.xlsx") and keeps the blob URL alive
// until the browser has picked it up — revoking it immediately after
// click() cancels the download in some browsers. Throws on failure.
export const downloadCalendarFile = async (cal) => {
  const file = calendarFile(cal);
  if (!file) throw new Error('No file to download');
  const res = await fetch(getImageUrl(file.url));
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  const blobUrl = window.URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
};
