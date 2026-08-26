# Arquitectura Asíncrona y Resiliencia

Para asegurar que el sistema no colapse bajo alta demanda (ej. venta de boletos para un concierto altamente anticipado), TicketRush separa los procesos críticos utilizando **Sistemas de Colas (Redis + BullMQ)** y **Webhooks**.

## 1. Prevención de Sobreventa (Concurrencia)
Cuando un cliente presiona "Comprar", el sistema **no** procesa el pago de inmediato. En su lugar, asegura los recursos:
1. Se abre una **Transacción en PostgreSQL** que bloquea la fila del Tier específico (`SELECT ... FOR UPDATE`).
2. Se evalúa si hay inventario. Si lo hay, se descuenta el inventario y se crea una orden en estado `PENDING`.
3. Se encola un *Job* en BullMQ programado para ejecutarse exactamente en 15 minutos.
4. Se cierra la transacción (liberando la base de datos para el siguiente usuario).

Esto garantiza que dos personas no puedan comprar el mismo asiento, incluso si hacen la petición al mismo milisegundo.

## 2. Recuperación de Inventario (Abandonos)
Si el cliente cierra el navegador o su tarjeta es declinada, el inventario quedaría "secuestrado" para siempre. 
Gracias al Job de Redis encolado en el paso anterior, pasados los 15 minutos, el *Worker* de NestJS despierta, revisa la orden y, si aún está `PENDING`, la cambia a `CANCELLED` y devuelve silenciosamente el stock a la base de datos para que otra persona pueda comprar.

## 3. Webhooks de Pago (El Desacoplamiento)
El backend no espera activamente a que Stripe procese el pago.
- El frontend gestiona el flujo del `clientSecret` directamente con Stripe.
- Cuando Stripe confirma el cobro, dispara una petición HTTP POST por detrás (`Webhook`) hacia el backend de TicketRush.
- Para garantizar resiliencia, este endpoint valida la firma criptográfica (`STRIPE_WEBHOOK_SECRET`) e inmediatamente empuja la tarea a otra cola de BullMQ (`webhook-queue`).
- Un Worker secundario procesa esta cola, cambia el estado de la orden a `PAID`, genera todos los tickets criptográficos y envía los correos con los PDFs correspondientes.

*Ventaja:* Si el servidor sufre una caída de 1 minuto exactamente cuando el cliente paga, Stripe reintentará enviar el Webhook automáticamente durante los próximos días hasta recibir un código `200 OK`. Ningún cliente se quedará sin sus boletos.
