import { apiClient, messageFromAxiosError } from '../../api/axios';
import type { CommonReportFilterParams } from '../../shared/utils/reportFilters';

/** Receipt detail row (Level 4 - melting_pool_transaction) */
export type StockManagementReceiptDetailRow = {
  weight: string;
  fine_weight: string;
  metal_ledger: string | null;
  melting_lot: string | null;
  created_by: string;
  created_at: string;
  id: string;
  transaction_type: string;
};

/** Issue detail row (Level 4 - metal_ledger) */
export type StockManagementIssueDetailRow = {
  gross_weight: string;
  fine_weight: string;
  voucher_no: string;
  job_cards: string[];
};

/** Purity level (receipt or issue) */
export type StockManagementPurityGroup = {
  purity: string;
  total_weight: string;
  total_fine_weight: string;
  details: StockManagementReceiptDetailRow[] | StockManagementIssueDetailRow[];
};

/** Item level (receipt or issue) */
export type StockManagementItemGroup = {
  item_name: string;
  total_weight: string;
  total_fine_weight: string;
  purities: StockManagementPurityGroup[];
};

/** Item group level (receipt or issue) */
export type StockManagementItemTypeGroup = {
  item_type: string;
  total_weight: string;
  total_fine_weight: string;
  items: StockManagementItemGroup[];
};

/** Receipt sub-section (metal_ledger_receipt_in or additional_weight_out) */
export type StockManagementReceiptSubSection = {
  total_balance_weight: string;
  total_balance_fine_weight: string;
  item_groups: StockManagementItemTypeGroup[];
};

/** Receipt details root */
export type StockManagementReceiptDetails = {
  total_balance_weight: string;
  total_balance_fine_weight: string;
  metal_ledger_receipt_in: StockManagementReceiptSubSection;
  additional_weight_out: StockManagementReceiptSubSection;
};

/** Job card row (department production Level 3) */
export type StockManagementJobCardRow = {
  name: string;
  balance_weight: string;
  balance_fine_weight: string;
  department: string;
  department_group: string;
  design: string;
  melting_lot: string | null;
  parent_melting_lot: string | null;
};

/** Pool IN detail row */
export type StockManagementPoolInRow = {
  transaction_type: string;
  item: string | null;
  weight: string;
  fine_weight: string;
  job_card: string | null;
  metal_ledger: string | null;
  id: string;
};

/** Pool OUT detail row */
export type StockManagementPoolOutRow = {
  transaction_type: string;
  item: string | null;
  weight: string;
  fine_weight: string;
  melting_lot: string | null;
  metal_ledger: string | null;
  id: string;
};

/** Purity in pool balance */
export type StockManagementPoolPurity = {
  purity: string;
  balance_weight: string;
  balance_fine_weight: string;
  in_details: StockManagementPoolInRow[];
  out_details: StockManagementPoolOutRow[];
};

/** Product in department production */
export type StockManagementProductGroup = {
  product: string;
  total_balance_weight: string;
  total_balance_fine_weight: string;
  purities: {
    purity: string;
    total_balance_weight: string;
    total_balance_fine_weight: string;
    job_cards: StockManagementJobCardRow[];
  }[];
};

/** Department production block */
export type StockManagementDepartmentProduction = {
  total_balance_weight: string;
  total_balance_fine_weight: string;
  products: StockManagementProductGroup[];
};

/** Pool balance block */
export type StockManagementPoolBalance = {
  total_balance_weight: string;
  total_balance_fine_weight: string;
  purities: StockManagementPoolPurity[];
};

/** Production root */
export type StockManagementProduction = {
  total_balance_weight: string;
  total_balance_fine_weight: string;
  department_production: StockManagementDepartmentProduction;
  pool_balance: StockManagementPoolBalance;
};

/** Issue details root */
export type StockManagementIssueDetails = {
  total_balance_weight: string;
  total_balance_fine_weight: string;
  item_groups: StockManagementItemTypeGroup[];
};

/** Balance stock root */
export type StockManagementBalanceStock = {
  balance_weight: string;
  balance_fine_weight: string;
};

/** Full report data root */
export type StockManagementReportData = {
  receipt_details: StockManagementReceiptDetails;
  production: StockManagementProduction;
  issue_details: StockManagementIssueDetails;
  balance_stock: StockManagementBalanceStock;
};

export type StockManagementReportResponse = {
  success?: boolean;
  message?: string;
  data?: StockManagementReportData;
  errors?: unknown;
  status_code?: number;
};

/**
 * GET /api/v1/accounts/reports/stock-management
 * Optional query params (apply only to Issue section): customer, date_from, date_to, purity.
 */
export async function getStockManagementReport(
  params?: CommonReportFilterParams
): Promise<StockManagementReportData> {
  const url = '/api/v1/accounts/reports/stock-management';
  const queryParams: Record<string, string> = {};
  if (params?.customer) queryParams.customer = params.customer;
  if (params?.date_from) queryParams.date_from = params.date_from;
  if (params?.date_to) queryParams.date_to = params.date_to;
  if (params?.purity) queryParams.purity = params.purity;

  console.log('[GoldFlow] [stockManagementReport.api] getStockManagementReport: request', {
    url,
    params: queryParams,
  });

  try {
    const res = await apiClient.get<StockManagementReportResponse>(url, { params: queryParams });
    const data = res.data;

    console.log('[GoldFlow] [stockManagementReport.api] getStockManagementReport: response', {
      data,
    });

    if (data?.success && data.data) {
      return data.data;
    }

    const errorMsg = data?.message ?? 'Failed to load stock management report';
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to load stock management report');
    console.log('[GoldFlow] [stockManagementReport.api] getStockManagementReport: error', {
      errMsg,
    });
    throw new Error(errMsg);
  }
}
