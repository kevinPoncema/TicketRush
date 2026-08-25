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
        };

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
  }
};
