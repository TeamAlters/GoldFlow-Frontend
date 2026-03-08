/**
 * Shared formatters for report numeric and date display.
 * Use 4 decimal places for weights; consistent date formatting.
 */

export function formatReportNum(s: string | null | undefined): string {
  if (s == null || s === '') return '—';
  const n = Number(String(s).trim());
  return Number.isFinite(n)
    ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : '—';
}

export function formatReportDate(s: string | null | undefined): string {
  if (s == null || s === '') return '—';
  const d = new Date(s);
  return Number.isFinite(d.getTime())
    ? d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : '—';
}
