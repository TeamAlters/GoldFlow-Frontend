/**
 * Melting Lot APIs
 * API endpoints for melting lot operations and metal pool balance
 */

import { apiClient, messageFromAxiosError } from '../../../api/axios';

// Weight detail type for update
export type WeightDetailPayload = {
  id?: string;
  selected_purity: string;
  selected_purity_percentage: number;
  selected_weight: number;
  description?: string;
};

// Update melting lot payload
export type UpdateMeltingLotPayload = {
  parent_melting_lot?: string | null;
  product?: string;
  purity?: string;
  purity_percentage?: number;
  accessory_purity?: string;
  wire_size?: string;
  thickness?: string;
  design_name?: string;
  description?: string;
  weight_details?: WeightDetailPayload[];
};

// Response type for melting lot operations
export type MeltingLotResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  errors?: unknown;
  status_code?: number;
};

export type MetalPoolBalance = {
  purity: string;
  purity_percentage: number;
  balance_weight: number;
  total_fine_weight: number;
};

export type MetalPoolBalanceResponse = {
  success?: boolean;
  message?: string;
  data?: {
    balances?: MetalPoolBalance[];
    total_purities?: number;
  };
  errors?: unknown;
  status_code?: number;
};

/**
 * GET /api/v1/metal-pool/balance
 * Fetches live metal pool balances (available purities and their weights)
 */
export async function fetchMetalPoolBalance(): Promise<MetalPoolBalance[]> {
  const url = '/api/v1/metal-pool/balance';
  console.log('[GoldFlow] [meltingLot.api] fetchMetalPoolBalance: request', { url });

  try {
    const res = await apiClient.get<MetalPoolBalanceResponse>(url);
    const data = res.data;

    // Handle {success, data: { balances: [...] }} format
    if (data?.success && data?.data?.balances) {
      // Convert balance_weight and total_fine_weight to numbers
      // purity_percentage calculated from balance_weight and total_fine_weight
      const balances = data.data.balances.map((b) => {
        const balanceWeight = parseFloat(String(b.balance_weight)) || 0;
        const totalFineWeight = parseFloat(String(b.total_fine_weight)) || 0;
        // purity_percentage = (total_fine_weight / balance_weight) * 100
        const purityPercentage = balanceWeight > 0 ? (totalFineWeight / balanceWeight) * 100 : 0;
        return {
          purity: b.purity,
          purity_percentage: purityPercentage,
          balance_weight: balanceWeight,
          total_fine_weight: totalFineWeight,
        };
      });
      console.log('[GoldFlow] [meltingLot.api] fetchMetalPoolBalance: success', {
        count: balances.length,
      });
      return balances;
    }

    // Handle direct array response
    if (Array.isArray(data)) {
      console.log('[GoldFlow] [meltingLot.api] fetchMetalPoolBalance: success (array)', {
        count: data.length,
      });
      return data;
    }

    console.warn('[GoldFlow] [meltingLot.api] fetchMetalPoolBalance: unexpected response', {
      data,
    });
    return [];
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to fetch metal pool balance');
    console.log('[GoldFlow] [meltingLot.api] fetchMetalPoolBalance: failed', { errMsg });
    throw new Error(errMsg);
  }
}

/**
 * PUT /api/v1/entities/melting_lot/{lot_name}
 * Updates an existing melting lot
 */
export async function updateMeltingLot(
  lotName: string,
  payload: UpdateMeltingLotPayload
): Promise<MeltingLotResponse> {
  const url = `/api/v1/entities/melting_lot/${encodeURIComponent(lotName)}`;
  console.log('[GoldFlow] [meltingLot.api] updateMeltingLot: request', { url, payload });

  try {
    const res = await apiClient.put<MeltingLotResponse>(url, payload);
    const data = res.data;

    console.log('[GoldFlow] [meltingLot.api] updateMeltingLot: response', { data });

    if (data.success) {
      return data;
    }

    // Handle error case
    const errorMsg = data.message || 'Failed to update melting lot';
    console.log('[GoldFlow] [meltingLot.api] updateMeltingLot: failed', { errorMsg });
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to update melting lot');
    console.log('[GoldFlow] [meltingLot.api] updateMeltingLot: failed', { errMsg });
    throw new Error(errMsg);
  }
}

/**
 * PUT /api/v1/melting/lots/{name}/submit
 * Submits a melting lot for processing
 */
export async function submitMeltingLot(lotName: string): Promise<MeltingLotResponse> {
  const url = `/api/v1/melting/lots/${encodeURIComponent(lotName)}/submit`;
  console.log('[GoldFlow] [meltingLot.api] submitMeltingLot: request', { url });

  try {
    const res = await apiClient.put<MeltingLotResponse>(url);
    const data = res.data;

    console.log('[GoldFlow] [meltingLot.api] submitMeltingLot: response', { data });

    if (data.success) {
      return data;
    }

    // Handle error case
    const errorMsg = data.message || 'Failed to submit melting lot';
    console.log('[GoldFlow] [meltingLot.api] submitMeltingLot: failed', { errorMsg });
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(err, 'Failed to submit melting lot');
    console.log('[GoldFlow] [meltingLot.api] submitMeltingLot: failed', { errMsg });
    throw new Error(errMsg);
  }
}
