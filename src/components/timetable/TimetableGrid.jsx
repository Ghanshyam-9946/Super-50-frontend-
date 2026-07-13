import { forwardRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

// NOTE: Tailwind v4's default palette (blue-900, gray-50, gray-600, etc.)
// compiles to oklch()/color-mix() colors. The canvas renderer used for the
// "Download PDF" feature can choke on those. Only pure black/white Tailwind
// classes are safe (they compile to plain hex) — every other colour in this
// component is applied as an inline style with a plain hex value instead.
const INK = {
  navy: '#1e3a8a',
  navyBg: '#eff6ff',
  grayBg: '#f9fafb',
  grayText: '#4b5563',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
};

/**
 * Builds the ordered list of columns (subject/lab slots + the fixed lunch
 * column) for a single day, honouring merged (multi-period) cells. This
 * mirrors the backend's `cells: [{ periodStart, span, subject, faculty }]`
 * shape — a cell never crosses the lunch break column.
 */
function buildDayColumns(dayEntry, periodsCount, breakAfterPeriod) {
  const cellsByStart = {};
  (dayEntry?.cells || []).forEach((c) => {
    cellsByStart[c.periodStart] = c;
  });

  const covered = new Set();
  const columns = [];

  for (let p = 1; p <= periodsCount; p++) {
    if (p === breakAfterPeriod + 1) columns.push({ type: 'break' });
    if (covered.has(p)) continue;

    const cell = cellsByStart[p];
    const maxSpan = p <= breakAfterPeriod ? breakAfterPeriod - p + 1 : periodsCount - p + 1;

    if (cell) {
      const span = Math.max(1, Math.min(cell.span || 1, maxSpan));
      for (let k = 1; k < span; k++) covered.add(p + k);
      columns.push({ type: 'slot', span, subject: cell.subject, faculty: cell.faculty });
    } else {
      columns.push({ type: 'slot', span: 1, subject: '', faculty: '' });
    }
  }
  return columns;
}

/** Header columns: period labels/times with the fixed Lunch column inserted at the right spot. */
function buildHeaderColumns(periods, breakAfterPeriod, breakLabel, breakTime) {
  const columns = [];
  periods.forEach((p, i) => {
    const periodNum = i + 1;
    if (periodNum === breakAfterPeriod + 1) {
      columns.push({ type: 'break', label: breakLabel, time: breakTime });
    }
    columns.push({ type: 'period', label: p.label, time: p.time });
  });
  return columns;
}

const TimetableGrid = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const periods = data.periods?.length ? data.periods : [];
  const breakAfterPeriod = data.breakAfterPeriod ?? 4;
  const headerColumns = buildHeaderColumns(periods, breakAfterPeriod, data.breakLabel, data.breakTime);

  const dayMap = {};
  (data.days || []).forEach((d) => {
    dayMap[d.day] = d;
  });

  const signatories = data.signatories?.length
    ? data.signatories
    : [{ designation: 'Prepared by', name: '' }];

  return (
    <div
      ref={ref}
      className="bg-white text-black p-6 rounded-md"
      style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
    >
      {/* Letterhead */}
      <div className="flex items-center gap-4 mb-1">
        <div
          className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{ border: `2px solid ${INK.navy}`, backgroundColor: INK.navyBg }}
        >
          {data.logoUrl ? (
            <img src={getImageUrl(data.logoUrl)} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <CalendarDays size={28} style={{ color: INK.navy }} />
          )}
        </div>
        <div className="flex-1 text-center pr-16">
          <h1 className="text-[26px] font-bold tracking-tight leading-tight">{data.instituteName}</h1>
          <p className="text-[15px] font-bold mt-1">{data.departmentHeading}</p>
        </div>
      </div>

      {/* Session / Class / w.e.f row */}
      <div className="flex items-center justify-between px-2 py-2 text-[14px] font-bold border-t-2 border-black mt-2 mb-3">
        <span>SESSION: {data.session}</span>
        <span className="text-[16px]">
          {data.className}
          {data.roomNo ? ` (Room No - ${data.roomNo})` : ''}
        </span>
        <span>
          w.e.f. <span className="font-normal">{fmtDate(data.effectiveFrom) || '—'}</span>
        </span>
      </div>

      {/* Main grid */}
      <table className="w-full border-collapse text-[12px]" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="border border-black bg-white w-[90px]" />
            {headerColumns.map((c, i) =>
              c.type === 'break' ? (
                <th key={`hb-${i}`} className="border border-black py-1.5 px-1 font-bold" style={{ backgroundColor: INK.grayBg }}>
                  {c.label}
                  <div className="font-normal text-[11px]">{c.time}</div>
                </th>
              ) : (
                <th key={`hp-${i}`} className="border border-black py-1.5 px-1">
                  <div className="font-bold">{c.label}</div>
                  <div className="font-normal text-[11px]">{c.time}</div>
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => {
            const columns = buildDayColumns(dayMap[day], periods.length, breakAfterPeriod);
            return (
              <tr key={day}>
                <td className="border border-black font-bold text-left align-middle px-2 py-3 whitespace-nowrap">
                  {day}
                </td>
                {columns.map((col, i) =>
                  col.type === 'break' ? (
                    <td key={`b-${day}-${i}`} className="border border-black" style={{ backgroundColor: INK.grayBg }} />
                  ) : (
                    <td key={`s-${day}-${i}`} colSpan={col.span} className="border border-black align-middle px-1.5 py-2 text-center">
                      {col.subject && <div className="font-semibold leading-snug">{col.subject}</div>}
                      {col.faculty && <div className="leading-snug mt-1">{col.faculty}</div>}
                    </td>
                  )
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between text-[10px] mt-1" style={{ color: INK.grayText }}>
        <span>Timetable generated: {fmtDate(data.updatedAt || data.createdAt)}</span>
        <span className="italic">SCOPE Timetables</span>
      </div>

      {/* Signatory boxes */}
      <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: `repeat(${signatories.length}, minmax(0, 1fr))` }}>
        {signatories.map((s, i) => (
          <div key={i} className="border border-black rounded-sm h-20 flex flex-col items-center justify-center text-center px-2">
            <p className="font-bold text-[13px]">{s.name || '\u00A0'}</p>
            <p className="text-[12px] italic mt-1">{s.designation}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

TimetableGrid.displayName = 'TimetableGrid';

export default TimetableGrid;
