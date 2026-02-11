/**
 * Shared axios instance and helpers for API calls.
 * Base URL from VITE_API_BASE_URL. Auth token attached via request interceptor.
 * 401 / auth errors trigger logout, one toast, and redirect to login (unless request sets skipAuthRedirect).
 */

import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../auth/auth.store';
import { toast } from '../stores/toast.store';
import { isAuthError } from '../shared/utils/errorHandling';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

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

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<unknown>) => {
    const config = error.config;
    if (config?.skipAuthRedirect === true) {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const msg = messageFromAxiosError(error, '');
    if (status === 401 || isAuthError(msg)) {
      useAuthStore.getState().logout();
      toast.error('Session expired. Please sign in again.');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

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
