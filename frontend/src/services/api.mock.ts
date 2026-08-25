// Este servicio simulará las llamadas al Backend utilizando promesas y localStorage.
// Cuando el backend esté listo, simplemente reemplazaremos el contenido de estas funciones con fetch() o axios.

export const MockApiService = {
  async getEventDetails(eventId: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: eventId,
          name: "Neon Nights Festival",
          date: "2026-12-31T20:00:00.000Z",
          location: "Arena VANTAGE, Neo-Tokyo",
          tiers: [
            { id: "t1", name: "General Access", price: 45.00, available: true },
            { id: "t2", name: "VIP Backstage", price: 150.00, available: true }
          ]
        });
      }, 500);
    });
  },

  async createOrder(data: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const orderId = "ord_" + Math.random().toString(36).substr(2, 9);
        const accessPin = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const orderRecord = {
          orderId,
          accessPin,
          email: data.clientEmail,
          tickets: data.tiers,
          status: 'PAID'
        }

        // Persistencia temporal (Mocking BD + LocalStorage del cliente)
        localStorage.setItem(`vantage_order_${orderId}`, JSON.stringify(orderRecord));

        resolve({
          success: true,
          orderId,
          accessPin
        });
      }, 1200); // Simulamos latencia de red
    });
  },
  
  async recoverOrder(orderId: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = localStorage.getItem(`vantage_order_${orderId}`);
        if (data) resolve(JSON.parse(data));
        else reject(new Error("Order not found"));
      }, 300);
    });
  },

  async getUpcomingEventsByTenant(tenantId: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Buscar eventos guardados en localStorage desde el B2B
        const keys = Object.keys(localStorage).filter(k => k.startsWith('ticketrush_events_'))
        let allEvents: any[] = []
        for (const k of keys) {
          try {
            const evts = JSON.parse(localStorage.getItem(k) || '[]')
            allEvents = allEvents.concat(evts)
          } catch { /* ignorar entradas corruptas */ }
        }

        const now = new Date()
        const upcoming = allEvents
          .filter(e => e.tenantId === tenantId && new Date(e.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (upcoming.length > 0) {
          resolve(upcoming)
          return
        }

        // Fallback mock si no hay eventos guardados
        resolve([
          {
            id: 'mock-evt-1',
            tenantId,
            name: 'Neon Nights Festival',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
            location: 'Arena VANTAGE, Ciudad',
            tiers: [
              { id: 't1', name: 'General', price: 45.00, capacity: 200, description: '' },
              { id: 't2', name: 'VIP Backstage', price: 150.00, capacity: 20, description: 'Acceso exclusivo a zona VIP y barra libre.' }
            ]
          },
          {
            id: 'mock-evt-2',
            tenantId,
            name: 'Circuit Breaker Vol. 3',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
            location: 'Club Obsidian',
            tiers: [
              { id: 't3', name: 'Early Bird', price: 30.00, capacity: 50, description: 'Precio de acceso anticipado, cupos muy limitados.' },
              { id: 't4', name: 'General', price: 55.00, capacity: 300, description: '' }
            ]
          },
          {
            id: 'mock-evt-3',
            tenantId,
            name: 'SYNC: Techno Summit',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
            location: 'Warehouse District',
            tiers: [
              { id: 't5', name: 'General', price: 80.00, capacity: 500, description: '' }
            ]
          }
        ])
      }, 600)
    })
  },

  async recoverByPin(email: string, pin: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Buscamos primero en el localStorage por si acaso está pero no indexado
        const keys = Object.keys(localStorage).filter(k => k.startsWith('vantage_order_'))
        for (const k of keys) {
          const item = JSON.parse(localStorage.getItem(k) || '{}')
          if (item.email === email && item.accessPin === pin) {
            resolve([item])
            return
          }
        }
        
        // Simulación: Si no existe en LocalStorage (borró caché), inventamos una respuesta del Backend
        const fakeOrder = {
          orderId: "ord_" + Math.random().toString(36).substr(2, 9),
          accessPin: pin,
          email: email,
          tickets: [
            { tierId: "t1", name: "General Access", price: 45.00, quantity: 2 }
          ],
          status: 'PAID',
          eventName: 'Neon Nights Festival',
          organizationName: 'VANTAGE Productions'
        }
        
        // Restauramos en el localStorage
        localStorage.setItem(`vantage_order_${fakeOrder.orderId}`, JSON.stringify(fakeOrder));
        
        resolve([fakeOrder]);
      }, 1000);
    });
  }
}
