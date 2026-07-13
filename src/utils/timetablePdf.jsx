import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import TimetableGrid from '../components/timetable/TimetableGrid';

/**
 * Exports a timetable to a landscape A4 PDF.
 *
 * Why this doesn't just call html2canvas on the on-screen preview node:
 * Tailwind v4's Preflight applies `border-color: var(--color-border)` to
 * *every* element on the page via a universal selector, and that variable
 * (along with many `/opacity` utility classes used elsewhere in the app,
 * e.g. on Sidebar buttons and badges) resolves to oklch()/color-mix() —
 * CSS colour functions the canvas renderer can choke on. Rather than
 * chasing every colour utility across the whole app, we render a throwaway
 * copy of the timetable directly under <body>, with no Tailwind-styled
 * ancestor anywhere in its chain, capture *that*, then tear it down.
 */
export async function downloadTimetablePdf(timetableData) {
  if (!timetableData) throw new Error('Nothing to export yet');

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '1100px';
  container.style.background = '#ffffff';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise((resolve) => {
      root.render(<TimetableGrid data={timetableData} />);
      // Two frames so layout/paint settle before html2canvas reads the DOM
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = 8;
    const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const maxHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, imgWidth, imgHeight);

    const sectionPart = (timetableData.className || '').replace(/\s+/g, '_');
    const filename = `Timetable_Sem${timetableData.semester ?? ''}${sectionPart ? `_${sectionPart}` : ''}.pdf`;
    pdf.save(filename);
  } finally {
    root.unmount();
    container.remove();
  }
}
