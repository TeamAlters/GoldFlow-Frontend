import { apiClient, messageFromAxiosError } from '../../../api/axios';

export interface IssueTransaction {
  name: string;
  transaction_type: string;
  job_card: string;
  item: string;
  weight: string;
  fine_weight: string;
  karigar: string | null;
  purity: string | null;
  qty: string | null;
  design?: string;
  next_job_card?: string;
  created_at: string;
  modified_at?: string;
  created_by?: string;
  modified_by?: string;
}

export type CreateIssuePayload = {
  job_card: string;
  item: string;
  weight: number;
  design?: string;
  karigar?: string;
  qty?: number;
  purity?: string;
};

type IssueTransactionResponse = {
  success?: boolean;
  message?: string;
  data?: IssueTransaction;
  errors?: unknown;
  status_code?: number;
};

export type CreateReceiptPayload = {
  job_card: string;
  item: string;
  weight: number;
  fine_weight: number;
  design?: string;
  karigar?: string;
  purity?: string;
};

type ReceiptTransactionResponse = {
  success?: boolean;
  message?: string;
  data?: IssueTransaction;
  errors?: unknown;
  status_code?: number;
};

/**
 * POST /api/v1/manufacturing/job-cards/transactions/issue
 * Creates an Issue transaction for a job card.
 */
export async function createIssueTransaction(
  payload: CreateIssuePayload
): Promise<IssueTransaction> {
  const url = '/api/v1/manufacturing/job-cards/transactions/issue';
  console.log('[GoldFlow] [jobCardTransactions.api] createIssueTransaction: request', {
    url,
    payload,
  });

  try {
    const res = await apiClient.post<IssueTransactionResponse>(url, payload);
    const data = res.data;

    if (data?.success && data.data) {
      console.log(
        '[GoldFlow] [jobCardTransactions.api] createIssueTransaction: success',
        { name: data.data.name }
      );
      return data.data;
    }

    const errorMsg =
      data?.message || 'Failed to create issue transaction';
    console.log(
      '[GoldFlow] [jobCardTransactions.api] createIssueTransaction: failed',
      { errorMsg, data }
    );
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(
      err,
      'Failed to create issue transaction'
    );
    console.log(
      '[GoldFlow] [jobCardTransactions.api] createIssueTransaction: error',
      { errMsg }
    );
    throw new Error(errMsg);
  }
}

/**
 * POST /api/v1/manufacturing/job-cards/transactions/receipt
 * Creates a Receipt transaction for a job card.
 */
export async function createReceiptTransaction(
  payload: CreateReceiptPayload
): Promise<IssueTransaction> {
  const url = '/api/v1/manufacturing/job-cards/transactions/receipt';
  console.log('[GoldFlow] [jobCardTransactions.api] createReceiptTransaction: request', {
    url,
    payload,
  });

  try {
    const res = await apiClient.post<ReceiptTransactionResponse>(url, payload);
    const data = res.data;

    if (data?.success && data.data) {
      console.log(
        '[GoldFlow] [jobCardTransactions.api] createReceiptTransaction: success',
        { name: data.data.name }
      );
      return data.data;
    }

    const errorMsg =
      data?.message || 'Failed to create receipt transaction';
    console.log(
      '[GoldFlow] [jobCardTransactions.api] createReceiptTransaction: failed',
      { errorMsg, data }
    );
    throw new Error(errorMsg);
  } catch (err) {
    const errMsg = messageFromAxiosError(
      err,
      'Failed to create receipt transaction'
    );
    console.log(
      '[GoldFlow] [jobCardTransactions.api] createReceiptTransaction: error',
      { errMsg }
    );
    throw new Error(errMsg);
  }
}

/**
 * DELETE /api/v1/manufacturing/job-cards/transactions/{name}
 * Deletes an Issue transaction by its name.
 */
export async function deleteIssueTransaction(name: string): Promise<void> {
  const encoded = encodeURIComponent(name);
  const url = `/api/v1/manufacturing/job-cards/transactions/${encoded}`;
  console.log(
    '[GoldFlow] [jobCardTransactions.api] deleteIssueTransaction: request',
    { url, name }
  );

  try {
    await apiClient.delete(url);
    console.log(
      '[GoldFlow] [jobCardTransactions.api] deleteIssueTransaction: success',
      { name }
    );
  } catch (err) {
    const errMsg = messageFromAxiosError(
      err,
      `Failed to delete issue transaction ${name}`
    );
    console.log(
      '[GoldFlow] [jobCardTransactions.api] deleteIssueTransaction: error',
      { errMsg }
    );
    throw new Error(errMsg);
  }
}

