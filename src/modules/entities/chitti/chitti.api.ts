/**
 * Chitti-specific API: available-issues and submit.
 * CRUD uses admin.api (getEntity, createEntity, updateEntity, deleteEntity).
 */

import { apiClient, messageFromAxiosError } from '../../../api/axios';

const baseUrl = (): string => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const chittiPath = (): string => `${baseUrl()}/api/v1/chitti`;

export type ChittiTransactionType = 'Labour' | 'Purchase';

export type AvailableIssueRow = {
  voucher_no: string;
  customer?: string;
  purity?: string;
  gross_weight?: number;
  transaction_date?: string;
  [key: string]: unknown;
};

export type GetAvailableIssuesParams = {
  customer: string;
  purity: string;
  transaction_type: ChittiTransactionType;
  chitti_name?: string;
};

export type GetAvailableIssuesResponse = {
  success?: boolean;
  data?: AvailableIssueRow[];
  message?: string;
  errors?: string[];
};

/**
 * GET /api/v1/chitti/available-issues?customer=...&purity=...&transaction_type=...&chitti_name=...
 * Options for linked-issues multi-select. Use voucher_no as value.
 */
export async function getAvailableIssues(
  params: GetAvailableIssuesParams
): Promise<AvailableIssueRow[]> {
  const url = `${chittiPath()}/available-issues`;
  const query: Record<string, string> = {
    customer: params.customer,
    purity: params.purity,
    transaction_type: params.transaction_type,
  };
  if (params.chitti_name) {
    query.chitti_name = params.chitti_name;
  }
  const search = new URLSearchParams(query).toString();
  const fullUrl = `${url}?${search}`;
  console.log('[GoldFlow] [chitti.api] getAvailableIssues: request', { url: fullUrl.replace(/\?.*/, ''), params });
  try {
    const res = await apiClient.get<GetAvailableIssuesResponse>(fullUrl);
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to load available issues');
    console.log('[GoldFlow] [chitti.api] getAvailableIssues: failed', msg);
    throw new Error(msg);
  }
}

export type SubmitChittiResponse = {
  success?: boolean;
  message?: string;
};

/**
 * PUT /api/v1/chitti/{chitti_name}/submit
 * Submit a draft chitti. On success UI refetches detail/list.
 */
export async function submitChitti(chittiName: string): Promise<SubmitChittiResponse> {
  const url = `${chittiPath()}/${encodeURIComponent(chittiName)}/submit`;
  console.log('[GoldFlow] [chitti.api] submitChitti: request', { chittiName, url });
  try {
    const res = await apiClient.put<SubmitChittiResponse>(url, {});
    console.log('[GoldFlow] [chitti.api] submitChitti: success', { chittiName });
    return res.data ?? {};
  } catch (err) {
    const msg = messageFromAxiosError(err, 'Failed to submit chitti');
    console.log('[GoldFlow] [chitti.api] submitChitti: failed', { chittiName, msg });
    throw new Error(msg);
  }
}
