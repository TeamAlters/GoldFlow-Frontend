import { apiClient, messageFromAxiosError } from '../../../api/axios';

export type MetalLedgerResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  errors?: unknown;
  status_code?: number;
};

/**
 * PUT /api/v1/accounts/metal-ledger/{name}/close
 * Closes a metal ledger entry so it can no longer be edited.
 */
export async function closeMetalLedger(name: string): Promise<MetalLedgerResponse> {
  const encoded = encodeURIComponent(name);
  const url = `/api/v1/accounts/metal-ledger/${encoded}/close`;

  console.log('[GoldFlow] [metalLedger.api] closeMetalLedger: request', { url, name });

  try {
    const res = await apiClient.put<MetalLedgerResponse>(url);
    const data = res.data;

    console.log('[GoldFlow] [metalLedger.api] closeMetalLedger: response', { data });

    if (data?.success) {
      return data;
    }

    const errorMsg = data?.message || 'Failed to close metal ledger';
    console.log('[GoldFlow] [metalLedger.api] closeMetalLedger: failed', { errorMsg });
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to close metal ledger');
    console.log('[GoldFlow] [metalLedger.api] closeMetalLedger: error', { errMsg });
    throw new Error(errMsg);
  }
}

