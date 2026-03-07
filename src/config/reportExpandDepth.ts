import type { CustomerMetalLedgerCustomer } from '../modules/reports/customerMetalLedgerBalanceReport.api';

/**
 * Expand depth for report hierarchy. Controlled by VITE_REPORT_EXPAND_DEPTH.
 * - "max" or unset: expand all levels (customers + purities).
 * - Future: "0" = none, "1" = customers only, "2" = customers + purities.
 */
function getReportExpandDepth(): string {
  const v = import.meta.env.VITE_REPORT_EXPAND_DEPTH;
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : 'max';
}

/** Returns all expand keys for the given customers (customer + purity level). Used when depth is "max". */
export function getReportInitialExpanded(customers: CustomerMetalLedgerCustomer[]): Set<string> {
  const depth = getReportExpandDepth();
  const set = new Set<string>();

  if (depth !== 'max') {
    return set;
  }

  for (const c of customers) {
    const cKey = `customer-${c.customer}`;
    set.add(cKey);
    for (const p of c.purity_breakdown ?? []) {
      set.add(`customer-${c.customer}-purity-${p.purity}`);
    }
  }
  return set;
}
