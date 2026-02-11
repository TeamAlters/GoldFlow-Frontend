import { toast } from '../../stores/toast.store';

/** Regex for auth-related error messages (401, unauthorized, credentials, validate). */
const AUTH_ERROR_PATTERN = /credentials|401|validate|unauthorized/i;

/**
 * Returns true if the message indicates an auth/credentials error.
 * Use when deciding whether to show a generic error toast or redirect to login.
 */
export function isAuthError(message: string | null | undefined): boolean {
  if (message == null || typeof message !== 'string') return false;
  return AUTH_ERROR_PATTERN.test(message);
}

/**
 * Shows an error toast only when the message is present and not an auth error.
 * Use in logout/catch flows where 401/credentials should not be shown (user is already being logged out).
 */
export function showErrorToastUnlessAuth(message: string | null | undefined): void {
  if (message && !isAuthError(message)) {
    toast.error(message);
  }
}
