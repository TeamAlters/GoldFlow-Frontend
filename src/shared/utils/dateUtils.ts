/** Format ISO date-time string for UI (e.g. "31 Jan 2026, 12:37 pm") */
function formatDateTime(isoOrValue: string | number | null | undefined): string {
    if (isoOrValue === null || isoOrValue === undefined) return '–';
    const s = String(isoOrValue).trim();
    if (!s) return '–';
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return s;
    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function isDateTimeValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  return ISO_DATE_REGEX.test(String(val));
}

export { formatDateTime, isDateTimeValue };