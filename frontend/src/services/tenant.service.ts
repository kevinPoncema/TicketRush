import { api } from './api'

export const TenantService = {
  async getConfig() {
    return api.get<any>('/tenant-config')
  },

  async updateConfig(data: { webhookUrl?: string; customDomain?: string; brandColor?: string }) {
    return api.put<any>('/tenant-config', data)
  },

  async deleteConfig() {
    return api.delete('/tenant-config')
  },
}
