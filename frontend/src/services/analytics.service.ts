import { api } from './api'

export const AnalyticsService = {
  async getSummary() {
    return api.get<any>('/analytics/summary')
  },
  async getEventAnalytics(eventId: string) {
    return api.get<any>(`/analytics/events/${eventId}`)
  }
}
