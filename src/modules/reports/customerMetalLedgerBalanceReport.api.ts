import { apiClient, messageFromAxiosError } from '../../api/axios';

/** Level 4: single receipt or issue entry */
export type CustomerMetalLedgerEntry = {
  voucher_no: string;
  transaction_type: string;
  transaction_date: string;
  wastage: string | null;
  gross_weight: string;
  fine_weight: string;
  fine_weight_with_wastage: string;
  rate_cut_weight: string;
  hallmark_amount: string;
  stone_amount: string;
  gold_rate: string;
  amount: string;
  total_taxable_amount: string;
  total_taxes: string;
  final_amount: string;
  created_at: string;
  created_by: string;
};

/** Level 3: receipts or issues block with totals and entries */
export type ReceiptsOrIssuesBlock = {
  total_gross_weight: string;
  total_fine_weight: string;
  total_fine_weight_with_wastage: string;
  total_final_amount: string;
  entries: CustomerMetalLedgerEntry[];
};

/** Level 2: purity breakdown with receipts and issues */
export type PurityBreakdownItem = {
  purity: string;
  purity_percentage: string;
  balance_gross_weight: string;
  balance_fine_weight: string;
  receipts: ReceiptsOrIssuesBlock;
  issues: ReceiptsOrIssuesBlock;
};

/** Level 1: customer with balance and purity breakdown */
export type CustomerMetalLedgerCustomer = {
  customer: string;
  balance_weight: string;
  balance_fine_weight: string;
  purity_breakdown: PurityBreakdownItem[];
};

export type CustomerMetalLedgerBalanceResponse = {
  success?: boolean;
  message?: string;
  data?: { customers: CustomerMetalLedgerCustomer[] };
  errors?: unknown;
  status_code?: number;
};

export type CustomerMetalLedgerBalanceParams = {
  customer?: string;
  date_from?: string;
  date_to?: string;
  purity?: string;
};

/**
 * GET /api/v1/accounts/reports/customer-metal-ledger-balance
 * Query params (all optional): customer, date_from, date_to, purity (ISO dates for date params).
 */
export async function getCustomerMetalLedgerBalanceReport(
  params?: CustomerMetalLedgerBalanceParams
): Promise<CustomerMetalLedgerCustomer[]> {
  const url = '/api/v1/accounts/reports/customer-metal-ledger-balance';
  const queryParams: Record<string, string> = {};
  if (params?.customer) queryParams.customer = params.customer;
  if (params?.date_from) queryParams.date_from = params.date_from;
  if (params?.date_to) queryParams.date_to = params.date_to;
  if (params?.purity) queryParams.purity = params.purity;

  console.log('[GoldFlow] [customerMetalLedgerBalanceReport.api] getCustomerMetalLedgerBalanceReport: request', { url, params: queryParams });

  try {
    const res = await apiClient.get<CustomerMetalLedgerBalanceResponse>(url, { params: queryParams });
    const data = res.data;

    console.log('[GoldFlow] [customerMetalLedgerBalanceReport.api] getCustomerMetalLedgerBalanceReport: response', { data });

    if (data?.success && data.data) {
      return Array.isArray(data.data.customers) ? data.data.customers : [];
    }

    const errorMsg = data?.message ?? 'Failed to load customer metal ledger balance report';
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to load customer metal ledger balance report');
    console.log('[GoldFlow] [customerMetalLedgerBalanceReport.api] getCustomerMetalLedgerBalanceReport: error', { errMsg });
    throw new Error(errMsg);
  }
}
