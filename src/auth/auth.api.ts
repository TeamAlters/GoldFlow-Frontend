/**
 * Auth API – login, register, registration-status, logout
 * Uses shared apiClient (axios) with VITE_API_BASE_URL.
 */

import axios from 'axios';
import { apiClient, messageFromAxiosError } from '../api/axios';

/** User-friendly messages when the API doesn't return a message */
function getFriendlyMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Something was wrong with your request. Please check and try again.',
    401: 'Please sign in to continue.',
    403: "You don't have permission to do this. Please contact an administrator.",
    404: 'This page or service could not be found. Please try again later.',
    422: 'Please check the information you entered and try again.',
    429: 'Too many attempts. Please wait a moment and try again.',
    500: 'Something went wrong on our end. Please try again later.',
    502: 'The service is temporarily unavailable. Please try again in a few minutes.',
    503: 'The service is busy right now. Please try again in a few minutes.',
  };
  return messages[status] ?? 'Something went wrong. Please try again.';
}

function authErrorFallback(err: unknown): string {
  const status = axios.isAxiosError(err) && err.response?.status != null ? err.response.status : 500;
  return getFriendlyMessage(status);
}

export type RegisterPayload = {
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type RegisterResponse = {
  message?: string;
  user?: { id: string; name?: string; email: string; phoneNumber?: string; [key: string]: unknown };
  [key: string]: unknown;
};

async function authFetch<T>(path: string, method: string, body?: object): Promise<T> {
  try {
    const res = await apiClient.request<T>({
      url: path,
      method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      data: body,
      skipAuthRedirect: true,
    });
    return res.data as T;
  } catch (err) {
    const fallback = authErrorFallback(err);
    const msg = messageFromAxiosError(err, fallback);
    throw new Error(msg);
  }
}

/** GET /api/v1/auth/registration-status – check if registration is allowed */
export type RegistrationStatusResponse = {
  registration_allowed: boolean;
  reason?: string;
};

export async function getRegistrationStatus(): Promise<RegistrationStatusResponse> {
  try {
    const res = await apiClient.get<{
      success?: boolean;
      data?: { registration_allowed?: boolean; reason?: string };
    }>('/api/v1/auth/registration-status', { skipAuthRedirect: true });
    const body = res.data ?? {};
    const allowed = body?.data?.registration_allowed ?? false;
    return { registration_allowed: allowed, reason: body?.data?.reason };
  } catch {
    return { registration_allowed: false };
  }
}

/** POST /api/v1/auth/login – login and get token (username_or_email accepts email or username) */
export type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  access_token?: string;
  user?: { id: string; username?: string; email: string; [key: string]: unknown };
  data?: { token?: string; access_token?: string; user?: unknown };
  [key: string]: unknown;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return authFetch<LoginResponse>('/api/v1/auth/login', 'POST', {
    username_or_email: payload.usernameOrEmail,
    password: payload.password,
  });
}

/** POST /api/v1/auth/register – register a new user */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return authFetch<RegisterResponse>('/api/v1/auth/register', 'POST', {
    username: payload.username,
    name: payload.name,
    email: payload.email,
    mobile_number: payload.phoneNumber,
    password: payload.password,
  });
}

/** POST /api/v1/auth/logout – invalidate session on server (call with current token) */
export async function logout(token: string): Promise<void> {
  try {
    await apiClient.post(
      '/api/v1/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    const msg = messageFromAxiosError(err, authErrorFallback(err));
    throw new Error(msg);
  }
}
