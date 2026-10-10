// Mirrors super-50-backend/src/utils/batchLabel.js — a batch is stored as
// just its starting year ("2023"); this derives the familiar "2023-27"
// display label (4-year program: second half is start+4's last two digits).
// Most pages should prefer the <BatchSelect> component, which already gets
// pre-labeled options from GET /api/master-data/batches — use this directly
// only when a page builds its own batch list from non-student data (e.g.
// historical drive/selection records) rather than the current student roster.
export const batchLabel = (startYear) => {
  const start = Number(startYear);
  if (!start) return String(startYear || "");
  return `${start}-${String(start + 4).slice(-2)}`;
};
