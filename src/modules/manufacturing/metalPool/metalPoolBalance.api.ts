import { apiClient, messageFromAxiosError } from '../../../api/axios';

export type MetalPoolBalanceRow = {
  purity: string;
  balance_weight: string;
  total_fine_weight: string;
};

export type MetalPoolBalanceResponse = {
  success?: boolean;
  message?: string;
  data?: {
    balances?: MetalPoolBalanceRow[];
    total_purities?: number;
  };
  errors?: unknown;
  status_code?: number;
};

/**
 * GET /api/v1/metal-pool/balance
 * Retrieves aggregated metal pool balances by purity.
 */
export async function getMetalPoolBalance(): Promise<{
  balances: MetalPoolBalanceRow[];
  totalPurities: number;
}> {
  const url = '/api/v1/metal-pool/balance';

  try {
    const res = await apiClient.get<MetalPoolBalanceResponse>(url);
    const data = res.data;

    if (data?.success && data.data) {
      return {
        balances: Array.isArray(data.data.balances) ? data.data.balances : [],
        totalPurities: Number(data.data.total_purities ?? 0),
      };
    }

    const errorMsg = data?.message || 'Failed to load metal pool balance';
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to load metal pool balance');
    throw new Error(errMsg);
  }
}

