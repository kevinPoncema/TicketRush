import { api } from './api'
import type { RegisterTenantDto, LoginDto, CreateMemberDto } from '../types/api.types'

export const AuthService = {
  async registerTenant(data: RegisterTenantDto) {
    return api.post('/auth/register-tenant', data)
  },

  async login(data: LoginDto) {
    return api.post<{ access_token: string }>('/auth/login', data)
  },

  async createMember(data: CreateMemberDto) {
    return api.post('/auth/create-member', data)
  },

  async deleteMember(memberId: string) {
    return api.delete(`/auth/member/${memberId}`)
  },

  async listMembers() {
    return api.get<any[]>('/auth/members')
  },
}
