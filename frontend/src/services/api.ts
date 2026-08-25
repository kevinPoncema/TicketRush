/**
 * Cliente HTTP base para todos los servicios.
 * Inyecta automáticamente el token JWT desde localStorage.
 * Para cambiar la URL base, modifica VITE_API_URL en el archivo .env.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request<T>(
  path: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(errorBody.message || `Error ${response.status}`)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown, extraHeaders: Record<string, string> = {}) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, extraHeaders),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
