export const EventService = {
  async listEvents() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventsStr = localStorage.getItem('mock_events')
        const parsed = eventsStr ? JSON.parse(eventsStr) : [];
        const cleanEvents = parsed.filter((e: any) => e && e.id && e.id.trim() !== '');
        if (parsed.length !== cleanEvents.length) localStorage.setItem('mock_events', JSON.stringify(cleanEvents));
        resolve(cleanEvents);
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
          ...eventData,
          id: isUpdate ? eventData.id : `evt-${Date.now()}`,
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
        try {
          const eventsStr = localStorage.getItem('mock_events');
          const events = eventsStr ? JSON.parse(eventsStr) : [];
          const event = events.find((e: any) => String(e.id) === String(id));
          if (event) resolve(event);
          else reject(new Error('Event not found'));
        } catch (e) {
          reject(e);
        }
      }, 300);
    });
  }
}
