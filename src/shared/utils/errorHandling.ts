import { toast } from '../../stores/toast.store';

/** Regex for auth-related error messages (401, unauthorized, credentials, validate). */
const AUTH_ERROR_PATTERN = /credentials|401|validate|unauthorized/i;

/** Dedupe: same message within this window (ms) will not show again. Prevents double toast from Strict Mode or duplicate catch. */
const ERROR_TOAST_DEBOUNCE_MS = 800;
let lastErrorMessage: string | null = null;
let lastErrorTime = 0;

/**
 * Returns true if the message indicates an auth/credentials error.
 * Use when deciding whether to show a generic error toast or redirect to login.
 */
export function isAuthError(message: string | null | undefined): boolean {
  if (message == null || typeof message !== 'string') return false;
  return AUTH_ERROR_PATTERN.test(message);
}

/**
 * Shows an error toast only when the message is present, not an auth error, and not a canceled request.
 * Dedupes: the same message within ERROR_TOAST_DEBOUNCE_MS will only show once (prevents double toast).
 */
export function showErrorToastUnlessAuth(message: string | null | undefined): void {
  if (!message || isAuthError(message) || isCanceledError(message)) return;
  const now = Date.now();
  if (lastErrorMessage === message && now - lastErrorTime < ERROR_TOAST_DEBOUNCE_MS) return;
  lastErrorMessage = message;
  lastErrorTime = now;
  toast.error(message);
}

/** Message indicates a canceled/aborted request (e.g. navigation or effect cleanup). Do not show toast. */
export function isCanceledError(message: string | null | undefined): boolean {
  if (message == null || typeof message !== 'string') return false;
  const m = message.toLowerCase();
  return m === 'canceled' || m === 'cancelled' || m === 'aborted' || m.includes('cancel') || m.includes('abort');
}

/** True when the error is a 404 Not Found from the API. Use to redirect to Page Not Found instead of showing toast. */
export function isNotFoundError(error: unknown): boolean {
  const code = (error as { statusCode?: number; response?: { status?: number } })?.statusCode
    ?? (error as { response?: { status?: number } })?.response?.status;
  return code === 404;
}
