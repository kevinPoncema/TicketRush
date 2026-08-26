import { api } from './api'
import { useAuthStore } from '../stores/auth.store'

export const EventService = {
  async listEvents() {
    const authStore = useAuthStore()
    const tenantId = authStore.user?.tenantId
    if (!tenantId) throw new Error('No autenticado')
    return api.get<any[]>(`/events?tenantId=${tenantId}`)
  },

  async saveEvent(eventData: any, tiers: any[]) {
    if (eventData.id) {
      await api.put(`/events/${eventData.id}`, {
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
        bannerUrl: eventData.bannerUrl,
      })
      for (const tier of tiers) {
        if (tier.id) {
          await api.put(`/ticket-tiers/${tier.id}`, {
            name: tier.name,
            price: Number(tier.price),
            capacity: Number(tier.capacity),
            availableStock: Number(tier.capacity),
            description: tier.description || '',
          })
        } else {
          await api.post('/ticket-tiers', {
            eventId: eventData.id,
            name: tier.name,
            price: Number(tier.price),
            capacity: Number(tier.capacity),
            availableStock: Number(tier.capacity),
            description: tier.description || '',
          })
        }
      }
      return api.get(`/events/${eventData.id}`)
    } else {
      const createdEvent: any = await api.post<any>('/events', {
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
        bannerUrl: eventData.bannerUrl,
      })
      for (const tier of tiers) {
        await api.post('/ticket-tiers', {
          eventId: createdEvent.id,
          name: tier.name,
          price: Number(tier.price),
          capacity: Number(tier.capacity),
          availableStock: Number(tier.capacity),
          description: tier.description || '',
        })
      }
      return createdEvent
    }
  },

  async getEvent(id: string) {
    return api.get<any>(`/events/${id}`)
  },

  async deleteEvent(id: string) {
    return api.delete(`/events/${id}`)
  },
}
