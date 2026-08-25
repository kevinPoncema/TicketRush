export const TenantService = {
  async getConfig() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const configStr = localStorage.getItem('mock_tenant_config')
        if (configStr) {
          resolve(JSON.parse(configStr))
        } else {
          resolve({
            webhookUrl: '',
            customDomain: '',
            brandColor: '#8b5cf6'
          })
        }
      }, 400)
    })
  },

  async updateConfig(data: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem('mock_tenant_config', JSON.stringify(data))
        resolve({ success: true })
      }, 600)
    })
  }
}
