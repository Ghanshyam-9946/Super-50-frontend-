// Excel of the saved MST marks, laid out like the printed MST sheet: title
// rows, then A/B/C → MCQ/Short Answer/Brief → marks → CO (merged), one row
// per student, a CO-wise total and the test total. One worksheet per test.

const cos = (fmt) => [...new Set(fmt.sections.flatMap((s) => s.items.map((it) => it.co)))];

const worksheet = (XLSX, fmt, sheets, info) => {
  const items = fmt.sections.flatMap((s) => s.items);
  const coList = cos(fmt);
  const fixed = ["S.No.", "Enrollment No.", "Student Name"];
  const tail = [...coList.map((co) => `${co} (${items.filter((it) => it.co === co).reduce((n, it) => n + it.max, 0)})`), `Total (${fmt.max})`, "Status"];
  const width = fixed.length + items.length + tail.length;
  const blank = () => Array(width).fill("");

  const rows = [];
  const title = (text) => { const r = blank(); r[0] = text; rows.push(r); };
  title(`${fmt.label} Marks Sheet (${fmt.max} Marks)`);
  title(`Subject: ${info.subjectName}${info.subjectCode ? ` (${info.subjectCode})` : ""}`);
  title(`Batch: ${info.batch}   Semester: ${info.semester}   Section: ${info.section}${info.faculty ? `   Faculty: ${info.faculty}` : ""}`);
  rows.push(blank());
  const top = rows.length;

  // Four header rows; fixed and tail columns span all four.
  const h = [blank(), blank(), blank(), blank()];
  fixed.forEach((t, c) => { h[0][c] = t; });
  let c = fixed.length;
  fmt.sections.forEach((s) => {
    h[0][c] = s.key;
    h[1][c] = s.title;
    s.items.forEach((it, i) => { h[2][c + i] = `${it.max} Marks`; h[3][c + i] = it.co; });
    c += s.items.length;
  });
  tail.forEach((t, i) => { h[0][c + i] = t; });
  rows.push(...h);

  sheets.forEach((s, i) => {
    const t = s.mst?.[fmt.key] || {};
    const parts = t.parts || {};
    const r = [i + 1, s.student?.enrollmentNumber || "", s.student?.name || ""];
    items.forEach((it) => r.push(t.absent ? "AB" : parts[it.key] ?? ""));
    coList.forEach((co) => {
      const mine = items.filter((it) => it.co === co && parts[it.key] != null);
      r.push(t.absent ? 0 : mine.length ? mine.reduce((n, it) => n + Number(parts[it.key]), 0) : "");
    });
    r.push(t.obtained ?? "");
    r.push(t.absent ? "Absent" : t.obtained == null ? "Not entered" : t.parts ? "" : "Synced from MST result");
    rows.push(r);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const merges = [0, 1, 2].map((r) => ({ s: { r, c: 0 }, e: { r, c: width - 1 } }));
  [...fixed.map((_, i) => i), ...tail.map((_, i) => fixed.length + items.length + i)]
    .forEach((col) => merges.push({ s: { r: top, c: col }, e: { r: top + 3, c: col } }));
  c = fixed.length;
  fmt.sections.forEach((s) => {
    if (s.items.length > 1) {
      merges.push({ s: { r: top, c }, e: { r: top, c: c + s.items.length - 1 } });
      merges.push({ s: { r: top + 1, c }, e: { r: top + 1, c: c + s.items.length - 1 } });
    }
    c += s.items.length;
  });
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 28 }, ...items.map(() => ({ wch: 9 })), ...tail.map((t) => ({ wch: Math.max(10, t.length + 2) }))];
  return ws;
};

// `tests` — the format entries to include (one tab, or both).
export async function exportMstSheet(format, tests, sheets, info) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  tests.forEach((key) => XLSX.utils.book_append_sheet(wb, worksheet(XLSX, format[key], sheets, info), format[key].label));
  const which = tests.length > 1 ? "MST-1_MST-2" : format[tests[0]].label;
  const name = `${which}_${info.subjectName}_${info.batch}_Sem${info.semester}_${info.section}.xlsx`.replace(/[^A-Za-z0-9._-]+/g, "_");
  XLSX.writeFile(wb, name);
}
