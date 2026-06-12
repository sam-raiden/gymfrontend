// Thin fetch wrapper around the kgf-backend API.
//
//   - Attaches `Authorization: Bearer <token>` from localStorage to every
//     authenticated request.
//   - Throws ApiError (with .status and .body) on non-2xx responses so
//     callers can show `err.message` in a toast, matching the existing
//     page code's error handling.
//   - On a 401 from an authenticated request, dispatches a window event
//     so AuthContext can drop the stale session and bounce to /login.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'kgf-token-v1';

export function getAuthToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAuthToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function handleResponse(res, auth) {
  if (res.status === 204) return null;

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      window.dispatchEvent(new CustomEvent('kgf:unauthorized'));
    }
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }

  return json;
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return handleResponse(res, auth);
}

// Multipart upload — used for photo uploads. Deliberately omits
// `Content-Type` so the browser sets the multipart boundary itself.
export async function apiUpload(path, formData, { auth = true } = {}) {
  const headers = {};
  if (auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse(res, auth);
}
