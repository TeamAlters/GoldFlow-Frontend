import { apiClient, messageFromAxiosError } from '../../../api/axios';

export interface JobCardAvailableBalanceRow {
  weight: number;
  parent_job_card: string;
  issue_transaction: string;
  purity: string;
  product: string;
  item: string;
  department: string;
  department_group: string;
  melting_lot: string | null;
  parent_melting_lot: string | null;
  fine_weight: number;
  created_at: string;
}

export type JobCardAvailableBalancesResponse = {
  success?: boolean;
  message?: string;
  data?: JobCardAvailableBalanceRow[];
  errors?: unknown;
  status_code?: number;
};

/**
 * GET /api/v1/manufacturing/job-cards/available-balances
 * Fetch available department balances for a given item and purity.
 */
export async function getAvailableJobCardBalances(
  purity: string,
  item: string
): Promise<JobCardAvailableBalanceRow[]> {
  const url = '/api/v1/manufacturing/job-cards/available-balances';

  console.log('[GoldFlow] [jobCardAvailableBalances.api] getAvailableJobCardBalances: request', {
    url,
    purity,
    item,
  });

  try {
    const res = await apiClient.get<JobCardAvailableBalancesResponse>(url, {
      params: { purity, item },
    });
    const data = res.data;

    console.log('[GoldFlow] [jobCardAvailableBalances.api] getAvailableJobCardBalances: response', {
      data,
    });

    if (data?.success && Array.isArray(data.data)) {
      return data.data;
    }

    const errorMsg =
      data?.message || 'Failed to fetch available job card balances';
    console.log(
      '[GoldFlow] [jobCardAvailableBalances.api] getAvailableJobCardBalances: failed',
      { errorMsg }
    );
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(
      err,
      'Failed to fetch available job card balances'
    );
    console.log(
      '[GoldFlow] [jobCardAvailableBalances.api] getAvailableJobCardBalances: error',
      { errMsg }
    );
    throw new Error(errMsg);
  }
}

