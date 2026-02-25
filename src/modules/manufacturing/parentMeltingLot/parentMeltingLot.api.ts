/**
 * Parent Melting Lot APIs
 * API endpoints for parent melting lot operations
 */

import { apiClient, messageFromAxiosError } from '../../../api/axios';

// Response type for parent melting lot operations
export type ParentMeltingLotResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  errors?: unknown;
  status_code?: number;
};

/**
 * PUT /api/v1/melting/parent-lots/{name}/close
 * Closes a parent melting lot
 */
export async function closeParentMeltingLot(name: string): Promise<ParentMeltingLotResponse> {
  const url = `/api/v1/melting/parent-lots/${encodeURIComponent(name)}/close`;
  console.log('[GoldFlow] [parentMeltingLot.api] closeParentMeltingLot: request', { url });

  try {
    const res = await apiClient.put<ParentMeltingLotResponse>(url);
    const data = res.data;

    console.log('[GoldFlow] [parentMeltingLot.api] closeParentMeltingLot: response', { data });

    if (data.success) {
      return data;
    }

    // Handle error case
    const errorMsg = data.message || 'Failed to close parent melting lot';
    console.log('[GoldFlow] [parentMeltingLot.api] closeParentMeltingLot: failed', { errorMsg });
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to close parent melting lot');
    console.log('[GoldFlow] [parentMeltingLot.api] closeParentMeltingLot: failed', { errMsg });
    throw new Error(errMsg);
  }
}
