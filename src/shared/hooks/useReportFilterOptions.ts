import { useState, useEffect } from 'react';
import { getEntityReferences, mapReferenceItemsToOptions } from '../../modules/admin/admin.api';
import type { ReportFilterSelectOption } from '../utils/reportFilters';

/**
 * Loads customer and purity options for report filter dropdowns.
 * Use with buildCommonReportFilterConfig() and FilterComponent for reports
 * that share the same filter layout (customer, date from, date to, purity).
 */
export function useReportFilterOptions(): {
  customerOptions: ReportFilterSelectOption[];
  purityOptions: ReportFilterSelectOption[];
} {
  const [customerOptions, setCustomerOptions] = useState<ReportFilterSelectOption[]>([]);
  const [purityOptions, setPurityOptions] = useState<ReportFilterSelectOption[]>([]);

  useEffect(() => {
    getEntityReferences('customer')
      .then((items) =>
        setCustomerOptions(mapReferenceItemsToOptions(items, 'customer_name', 'customer_name'))
      )
      .catch(() => setCustomerOptions([]));
    getEntityReferences('purity')
      .then((items) => setPurityOptions(mapReferenceItemsToOptions(items, 'purity', 'purity')))
      .catch(() => setPurityOptions([]));
  }, []);

  return { customerOptions, purityOptions };
}
