import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { calendarFile } from '../utils/academicCalendarFile';

// Shows the academic calendar exactly as the admin uploaded it — nothing is
// parsed or reinterpreted. PDF → inline viewer. Excel → rendered like the
// workbook itself: every sheet as a tab, cell fill colours (holidays, exams,
// training…), merged cells, column widths and hidden rows as in the file.

// Solid cell fill → CSS colour. Theme 0/1 are the workbook's white/black
// (black fills are deliberate, e.g. dates that don't exist in a month).
const fillColor = (style) => {
  if (!style || style.patternType !== 'solid' || !style.fgColor) return null;
  const { rgb, theme } = style.fgColor;
  if (rgb) return `#${String(rgb).slice(-6)}`;
  if (theme === 0) return '#FFFFFF';
  if (theme === 1) return '#000000';
  return null;
};

// Font colours aren't available from the file, so pick readable text for
// the fill instead of assuming black.
const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 140;
};

const colWidthPx = (col) => col?.wpx || (col?.wch ? Math.round(col.wch * 7 + 5) : 64);
const cellText = (cell) => (cell ? cell.w ?? (cell.v == null ? '' : String(cell.v)) : '');

// Sheets often carry formatting across hundreds of blank rows/columns, so
// the rendered area is trimmed to the cells that actually hold something
// (plus any merge that starts inside that area).
function buildSheetTable(ws) {
  if (!ws || !ws['!ref']) return null;
  let maxR = -1;
  let maxC = -1;
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!' || !cellText(ws[addr]).trim()) continue;
    const { r, c } = XLSX.utils.decode_cell(addr);
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  if (maxR < 0) return { rows: [], widths: [] };

  const merges = ws['!merges'] || [];
  for (const m of merges) {
    if (m.s.r <= maxR && m.s.c <= maxC) {
      maxR = Math.max(maxR, m.e.r);
      maxC = Math.max(maxC, m.e.c);
    }
  }

  const hiddenRow = (r) => !!ws['!rows']?.[r]?.hidden;
  const hiddenCol = (c) => !!ws['!cols']?.[c]?.hidden;
  const covered = new Set();
  const spans = new Map();
  for (const m of merges) {
    if (m.s.r > maxR || m.s.c > maxC) continue;
    let rowSpan = 0;
    let colSpan = 0;
    for (let r = m.s.r; r <= Math.min(m.e.r, maxR); r++) if (!hiddenRow(r)) rowSpan++;
    for (let c = m.s.c; c <= Math.min(m.e.c, maxC); c++) if (!hiddenCol(c)) colSpan++;
    spans.set(`${m.s.r},${m.s.c}`, { rowSpan, colSpan });
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) if (r !== m.s.r || c !== m.s.c) covered.add(`${r},${c}`);
    }
  }

  const visibleCols = [];
  for (let c = 0; c <= maxC; c++) if (!hiddenCol(c)) visibleCols.push(c);

  const rows = [];
  for (let r = 0; r <= maxR; r++) {
    if (hiddenRow(r)) continue;
    const cells = [];
    for (const c of visibleCols) {
      const key = `${r},${c}`;
      if (covered.has(key)) continue;
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      cells.push({ key, text: cellText(cell), bg: fillColor(cell?.s), ...(spans.get(key) || {}) });
    }
    rows.push({ r, cells });
  }
  return { rows, widths: visibleCols.map((c) => colWidthPx(ws['!cols']?.[c])) };
}

// Keyed on the file URL by the parent, so switching calendars remounts this
// with fresh state instead of resetting it by hand.
function SpreadsheetViewer({ url, height }) {
  const [workbook, setWorkbook] = useState(null);
  const [error, setError] = useState('');
  const [sheetIndex, setSheetIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(getImageUrl(url))
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load the file (HTTP ${res.status})`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        const wb = XLSX.read(buf, { type: 'array', cellStyles: true });
        setWorkbook(wb);
        // Open on the sheet Excel itself would open on, if the file says.
        setSheetIndex(wb.Workbook?.Views?.[0]?.activeTab ?? 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not read the Excel file');
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const table = useMemo(
    () => (workbook ? buildSheetTable(workbook.Sheets[workbook.SheetNames[sheetIndex]]) : null),
    [workbook, sheetIndex]
  );

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border border-red-500/30 text-red-500 text-sm">
        <AlertTriangle size={16} className="shrink-0" /> {error}
      </div>
    );
  }
  if (!workbook) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--text-secondary)]">
        <Loader2 size={16} className="animate-spin" /> Opening calendar…
      </div>
    );
  }

  const totalWidth = table?.widths.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="space-y-2">
      {workbook.SheetNames.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {workbook.SheetNames.map((name, i) => (
            <button
              key={name}
              onClick={() => setSheetIndex(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                i === sheetIndex
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {name.trim() || `Sheet ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Always a white "paper" regardless of app theme, so the file's own
          colours read exactly as they do in Excel. */}
      <div className="overflow-auto rounded-xl border border-[var(--border-light)] bg-white" style={{ maxHeight: height }}>
        {!table || table.rows.length === 0 ? (
          <p className="p-6 text-sm text-center text-slate-500">This sheet is empty.</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: totalWidth }}>
            <colgroup>
              {table.widths.map((w, i) => <col key={i} style={{ width: w }} />)}
            </colgroup>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.r}>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.key}
                      rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                      colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                      style={{
                        border: '1px solid #d4d4d8',
                        padding: '2px 4px',
                        height: 22,
                        fontSize: 12,
                        lineHeight: 1.25,
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        background: cell.bg || '#FFFFFF',
                        color: cell.bg && isDark(cell.bg) ? '#FFFFFF' : '#111827',
                      }}
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AcademicCalendarViewer({ calendar, height = '75vh' }) {
  const file = calendarFile(calendar);

  if (!file) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl border border-amber-500/30 text-amber-600 text-sm">
        <AlertTriangle size={16} className="shrink-0" />
        This calendar was saved in the old format without its original file — please re-upload it.
      </div>
    );
  }

  if (file.type === 'pdf') {
    return (
      <iframe
        src={getImageUrl(file.url)}
        title={file.name}
        className="w-full rounded-xl border border-[var(--border-light)]"
        style={{ height }}
      />
    );
  }

  return <SpreadsheetViewer key={file.url} url={file.url} height={height} />;
}
