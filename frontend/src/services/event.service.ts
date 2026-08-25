export const EventService = {
  async listEvents() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventsStr = localStorage.getItem('mock_events')
        resolve(eventsStr ? JSON.parse(eventsStr) : [])
      }, 400)
    })
  },

  async saveEvent(eventData: any, tiers: any[]) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventsStr = localStorage.getItem('mock_events')
        const events = eventsStr ? JSON.parse(eventsStr) : []
        
        const isUpdate = !!eventData.id
        const newEvent = {
          id: isUpdate ? eventData.id : `evt-${Date.now()}`,
          ...eventData,
          tiers: tiers.map(t => ({ ...t, id: t.id || `tier-${Math.random().toString(36).substr(2, 6)}` }))
        }

        if (isUpdate) {
          const idx = events.findIndex((e: any) => e.id === newEvent.id)
          if (idx !== -1) events[idx] = newEvent
        } else {
          events.push(newEvent)
        }
        
        localStorage.setItem('mock_events', JSON.stringify(events))
        resolve(newEvent)
      }, 600)
    })
  },

  async getEvent(id: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const eventsStr = localStorage.getItem('mock_events')
        const events = eventsStr ? JSON.parse(eventsStr) : []
        const event = events.find((e: any) => e.id === id)
        if (event) resolve(event)
        else reject(new Error('Event not found'))
      }, 300)
    })
  }
}
