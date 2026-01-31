/**
 * Auth API – register (POST /api/v1/auth/register)
 * Base URL: set VITE_API_BASE_URL in .env (e.g. https://your-api.com)
 */

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? ''

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
  }
  return messages[status] ?? 'Something went wrong. Please try again.'
}

export type RegisterPayload = {
  username: string
  name: string
  email: string
  phoneNumber: string
  password: string
}

export type RegisterResponse = {
  message?: string
  user?: { id: string; name?: string; email: string; phoneNumber?: string; [key: string]: unknown }
  [key: string]: unknown
}

type AuthFetchOptions = Omit<RequestInit, 'body'> & { body?: object }

async function authFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const { body, ...rest } = options
  const url = `${getBaseUrl()}${path}`
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data: Record<string, unknown> = {}
  if (text.trim()) {
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      // non-JSON body, keep data as {}
    }
  }

  if (!res.ok) {
    // API shape: { success, message, errors: string[], status_code } or message/error/detail (string or array)
    const detail = data?.detail
    const detailStr = typeof detail === 'string' ? detail : undefined
    const detailArr = Array.isArray(detail) ? (detail as Array<{ loc?: unknown[]; msg?: string }>) : undefined
    const errorsArr = Array.isArray(data?.errors) ? data.errors : undefined
    const errorsStr =
      errorsArr && errorsArr.length > 0
        ? errorsArr
            .map((e) => (typeof e === 'string' ? e : (e as { message?: string; msg?: string })?.message ?? (e as { message?: string; msg?: string })?.msg ?? String(e)))
            .join(', ')
        : undefined
    const messageStr = typeof data?.message === 'string' ? data.message : undefined
    const messageArr = Array.isArray(data?.message) ? (data.message as string[]).join(', ') : undefined
    const message =
      (errorsStr && errorsStr.length > 0 ? errorsStr : null) ??
      messageStr ??
      messageArr ??
      (data?.error as string) ??
      detailStr ??
      (detailArr && detailArr.length > 0
        ? detailArr.map((d) => d.msg ?? (Array.isArray(d.loc) ? d.loc.join('.') + ': required' : 'Please check this field.')).join(', ')
        : getFriendlyMessage(res.status))
    throw new Error(message)
  }

  return data as T
}

/** GET /api/v1/auth/registration-status – check if registration is allowed */
export type RegistrationStatusResponse = {
  registration_allowed: boolean
  reason?: string
}

export async function getRegistrationStatus(): Promise<RegistrationStatusResponse> {
  const url = `${getBaseUrl()}/api/v1/auth/registration-status`
  const res = await fetch(url, { method: 'GET' })
  const text = await res.text()
  let body: { success?: boolean; data?: { registration_allowed?: boolean; reason?: string }; [key: string]: unknown } = {}
  if (text.trim()) {
    try {
      body = JSON.parse(text) as typeof body
    } catch {
      // ignore
    }
  }
  if (!res.ok) return { registration_allowed: false }
  const allowed = body?.data?.registration_allowed ?? false
  return { registration_allowed: allowed, reason: body?.data?.reason }
}

/** POST /api/v1/auth/login – login and get token */
export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  token?: string
  access_token?: string
  user?: { id: string; username?: string; email: string; [key: string]: unknown }
  data?: { token?: string; access_token?: string; user?: unknown }
  [key: string]: unknown
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await authFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: { username_or_email: payload.email, password: payload.password },
  })
  return data
}

/** POST /api/v1/auth/register – register a new user */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return authFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: {
      username: payload.username,
      name: payload.name,
      email: payload.email,
      mobile_number: payload.phoneNumber,
      password: payload.password,
    },
  })
}

/** POST /api/v1/auth/logout – invalidate session on server (call with current token) */
export async function logout(token: string): Promise<void> {
  const url = `${getBaseUrl()}/api/v1/auth/logout`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const text = await res.text()
    let data: Record<string, unknown> = {}
    if (text.trim()) {
      try {
        data = JSON.parse(text) as Record<string, unknown>
      } catch {
        // ignore
      }
    }
    const errorsArr = Array.isArray(data?.errors) ? data.errors : undefined
    const errorsStr =
      errorsArr && errorsArr.length > 0
        ? errorsArr
            .map((e) => (typeof e === 'string' ? e : (e as { message?: string; msg?: string })?.message ?? (e as { message?: string; msg?: string })?.msg ?? String(e)))
            .join(', ')
        : undefined
    const detailArr = Array.isArray(data?.detail) ? data.detail as Array<{ msg?: string; loc?: unknown[] }> : undefined
    const detailStr =
      detailArr && detailArr.length > 0
        ? detailArr.map((d) => d.msg ?? (Array.isArray(d.loc) ? d.loc.join('.') + ': required' : '')).join(', ')
        : undefined
    const message =
      errorsStr ??
      detailStr ??
      (typeof data?.message === 'string' ? data.message : undefined) ??
      (data?.error as string) ??
      getFriendlyMessage(res.status)
    throw new Error(message)
  }
}
