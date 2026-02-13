/**
 * Shared axios instance and helpers for API calls.
 * Base URL from VITE_API_BASE_URL. Auth token attached via request interceptor.
 * 401 / auth errors trigger logout, one toast, and redirect to login (unless request sets skipAuthRedirect).
 */

import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../auth/auth.store';
import { toast } from '../stores/toast.store';
import { isAuthError } from '../shared/utils/errorHandling';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
    skipDeduplication?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Map to track in-flight requests for deduplication.
 * Key: request key (method + url + params/data)
 * Value: Promise for the in-flight request
 */
const pendingRequests = new Map<string, Promise<AxiosResponse>>();

/**
 * Generate a unique key for a request based on method, URL, and parameters.
 * This key is used to identify duplicate requests.
 */
function getRequestKey(config: InternalAxiosRequestConfig): string {
  const { method = 'get', url = '', params, data } = config;
  
  // Normalize URL - handle both absolute and relative URLs
  let normalizedUrl = url || '';
  
  // Remove baseURL if present
  if (baseURL && normalizedUrl.startsWith(baseURL)) {
    normalizedUrl = normalizedUrl.substring(baseURL.length);
  }
  
  // Remove leading slash for consistency, then add it back
  normalizedUrl = normalizedUrl.replace(/^\/+/, '');
  normalizedUrl = '/' + normalizedUrl;
  
  // Remove query string (params are handled separately)
  normalizedUrl = normalizedUrl.split('?')[0];
  
  // Serialize params (query string parameters)
  let paramsStr = '';
  if (params) {
    try {
      // Sort params for consistent key generation
      const sortedParams = typeof params === 'object' && !Array.isArray(params)
        ? Object.keys(params)
            .sort()
            .reduce((acc, key) => {
              acc[key] = params[key];
              return acc;
            }, {} as Record<string, unknown>)
        : params;
      paramsStr = JSON.stringify(sortedParams);
    } catch {
      paramsStr = String(params);
    }
  }
  
  // Serialize data (request body) - should be empty for GET requests
  let dataStr = '';
  if (data) {
    try {
      // Sort data keys for consistent key generation
      if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        const sortedData = Object.keys(data)
          .sort()
          .reduce((acc, key) => {
            acc[key] = (data as Record<string, unknown>)[key];
            return acc;
          }, {} as Record<string, unknown>);
        dataStr = JSON.stringify(sortedData);
      } else {
        dataStr = JSON.stringify(data);
      }
    } catch {
      dataStr = String(data);
    }
  }
  
  const key = `${method.toUpperCase()}_${normalizedUrl}_${paramsStr}_${dataStr}`;
  return key;
}

/**
 * Clean up a request from the pending requests map.
 * Called after request completes (success or error).
 */
function cleanupRequest(key: string): void {
  // Use setTimeout to allow multiple components to receive the same promise
  // before cleaning up. This handles the case where StrictMode causes
  // the same request to be initiated twice in quick succession.
  setTimeout(() => {
    pendingRequests.delete(key);
  }, 100);
}

// Create the base axios instance
export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Helper function to handle deduplication for GET requests
function handleDeduplication<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
  makeRequest: () => Promise<R>
): Promise<R> {
  const method = (config.method || 'get').toLowerCase();
  const shouldDeduplicate =
    !config.skipDeduplication &&
    method === 'get' &&
    config.url &&
    !config.signal;
  
  if (shouldDeduplicate) {
    // Generate key from config
    const requestKey = getRequestKey(config as InternalAxiosRequestConfig);
    
    // Check for existing request - this must be synchronous
    const existingRequest = pendingRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest as Promise<R>;
    }

    // Create the request promise
    const requestPromise = makeRequest();

    // Store it IMMEDIATELY (synchronously) - this is critical to prevent race conditions
    // Store as AxiosResponse for the map, but return as R for type safety
    pendingRequests.set(requestKey, requestPromise as unknown as Promise<AxiosResponse>);
    
    // Clean up after request completes
    requestPromise
      .finally(() => {
        cleanupRequest(requestKey);
      });
    
    return requestPromise;
  }
  
  // For non-GET requests or when deduplication is disabled
  return makeRequest();
}

// Store original methods
const originalRequest = apiClient.request.bind(apiClient);
const originalGet = apiClient.get.bind(apiClient);

// Wrap the request method with proper axios types
apiClient.request = function <T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>
): Promise<R> {
  return handleDeduplication<T, R, D>(config, () => originalRequest<T, R, D>(config));
};

// Wrap the get method directly (most common for view pages) with proper axios types
apiClient.get = function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  const fullConfig: AxiosRequestConfig<D> = { ...config, method: 'get', url };
  return handleDeduplication<T, R, D>(fullConfig, () => originalGet<T, R, D>(url, config));
};

// Request interceptor for auth token (runs after request method)
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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
