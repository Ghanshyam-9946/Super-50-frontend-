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
