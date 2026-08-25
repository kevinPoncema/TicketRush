import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AuthService } from '../services/auth.service'
import type { LoginDto, RegisterTenantDto, User } from '../types/api.types'

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * (La verificación real ocurre en el backend)
 */
function decodeJwtPayload(token: string): any {
  try {
    const base64Payload = token.split('.')[1]
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('access_token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  function setUserFromToken(jwt: string) {
    const payload = decodeJwtPayload(jwt)
    if (payload) {
      user.value = {
        id: payload.sub,
        email: payload.email || '',
        role: payload.role,
        tenantId: payload.tenantId,
      }
    }
  }

  async function login(credentials: LoginDto) {
    const data: any = await AuthService.login(credentials)
    token.value = data.access_token
    localStorage.setItem('access_token', data.access_token)
    setUserFromToken(data.access_token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function register(data: RegisterTenantDto) {
    await AuthService.registerTenant(data)
    await login({ email: data.adminEmail, password: data.password })
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  // Rehidratar estado al cargar la app
  const savedToken = localStorage.getItem('access_token')
  if (savedToken) {
    setUserFromToken(savedToken)
  }

  return { user, token, isAuthenticated, isAdmin, login, register, logout }
})
