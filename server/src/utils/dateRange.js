// server/src/utils/dateRange.js
export function parseRange({ dateFrom, dateTo } = {}) {
  if (!dateFrom && !dateTo) return {};
  let from, to;
  if (dateFrom) from = new Date(`${dateFrom}T00:00:00.000Z`);
  if (dateTo) {
    const d = new Date(`${dateTo}T00:00:00.000Z`);
    to = new Date(d.getTime() + 24 * 60 * 60 * 1000); // exclusive end
  }
  return { from, to };
}
export function monthRangeUTC(year, month) {
  const y = Number(year), m0 = Number(month) - 1;
  const from = new Date(Date.UTC(y, m0, 1, 0, 0, 0, 0));
  const to   = new Date(Date.UTC(y, m0 + 1, 1, 0, 0, 0, 0));
  return { from, to };
}
