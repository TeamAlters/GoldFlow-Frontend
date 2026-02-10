/**
 * Shared axios instance and helpers for API calls.
 * Base URL from VITE_API_BASE_URL. Auth token attached via request interceptor.
 */

import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../auth/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && typeof token === 'string') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

/** Extract user-facing message from API error response body (detail, message, errors array). */
export function getApiErrorMessage(data: unknown, fallback: string): string {
  if (data == null || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  const detail = d.detail;
  const detailStr =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((x) => (typeof x === 'object' && x && 'msg' in x ? (x as { msg?: string }).msg : String(x))).join(', ')
        : null;
  const message = typeof d.message === 'string' ? d.message : null;
  const errors = Array.isArray(d.errors)
    ? (d.errors as unknown[]).map((e) =>
        typeof e === 'string' ? e : (e as { message?: string; msg?: string })?.message ?? (e as { msg?: string })?.msg ?? String(e)
      ).join(', ')
    : null;
  return detailStr ?? message ?? errors ?? fallback;
}

/** From an axios error, get a message string (for throwing new Error(msg)). */
export function messageFromAxiosError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<unknown>;
    if (ax.response?.data != null) {
      return getApiErrorMessage(ax.response.data, fallback);
    }
    if (ax.message) return ax.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
