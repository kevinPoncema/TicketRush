# 📋 Documento de Requerimientos: TicketRush

TicketRush es un motor transaccional B2B diseñado para la gestión de eventos, reserva de entradas y validación de accesos, enfocado en resolver problemas de concurrencia e integración.

---

## 🛠️ Requerimientos Funcionales (RF)

Define lo que el sistema **debe hacer** para satisfacer las necesidades del negocio.

*   **RF1 - Gestión Multi-Tenant y Accesos:** El sistema debe permitir registrar organizaciones (Tenants) y asignarles múltiples usuarios (empleados) con roles específicos (Admin, Staff) para gestionar la plataforma.
*   **RF2 - Catálogo e Inventario:** Un Tenant debe poder crear eventos especificando fecha, ubicación y múltiples categorías de entradas (Tiers), definiendo el precio y el aforo máximo de cada una.
*   **RF3 - Reserva Temporal (Soft Reserve):** Al iniciar el proceso de compra, el sistema debe bloquear el inventario seleccionado y garantizarlo al comprador durante un periodo de 10 minutos.
*   **RF4 - Liberación Automática:** Si la orden no es pagada tras los 10 minutos de gracia, el sistema debe expirar la orden y devolver el inventario al pool disponible de manera automática.
*   **RF5 - Emisión de Tickets (PDF On-The-Fly):** Tras un pago exitoso, el sistema debe generar un PDF renderizado en memoria RAM con los boletos digitales (Tickets "Al Portador"). A cada boleto se le asigna un QR con token criptográfico único (Firma HMAC) asociado a la orden.
*   **RF6 - Control de Puerta (Validación):** El sistema debe proveer un mecanismo (endpoint) para escanear y validar la autenticidad del boleto, marcándolo como `used` y previniendo que un mismo ticket ingrese dos veces.
*   **RF7 - Integración por Webhooks:** El administrador (Tenant) debe poder configurar una URL externa para recibir notificaciones (POST HTTP) automáticamente cada vez que se concrete una venta en su evento.
*   **RF8 - Recuperación de Entradas (Fricción Cero):** El sistema no debe exigir cuentas ni contraseñas al comprador final. Al generar una orden, se debe crear un PIN criptográfico corto y único. El usuario podrá recuperar sus boletos únicamente usando su correo y este PIN (Rate-Limited).

---

## ⚙️ Requerimientos No Funcionales (RNF)

Define **cómo** el sistema debe comportarse a nivel de arquitectura, rendimiento y seguridad.

*   **RNF1 - Concurrencia (Pessimistic Locking):** El sistema debe garantizar la integridad del inventario (`available_stock`) previniendo la sobreventa mediante bloqueos transaccionales a nivel de base de datos (`FOR UPDATE`) durante picos de alta demanda.
*   **RNF2 - Asincronía y Colas:** Las tareas de liberación de inventario y envío de webhooks no deben bloquear el hilo principal de la API HTTP. Deben procesarse en segundo plano utilizando un Message Broker (Redis/BullMQ).
*   **RNF3 - Idempotencia Transaccional:** Los endpoints de creación de órdenes y pagos deben exigir una `Idempotency-Key` para evitar cargos o reservas duplicadas en caso de fallos de red o reintentos del cliente.
*   **RNF4 - Seguridad Anti-Fraude:** La validación de boletos en puerta debe verificar la firma criptográfica (ej. HMAC) sin depender únicamente del ID secuencial o UUID, previniendo la manipulación y falsificación de QRs.
*   **RNF5 - Arquitectura Desacoplada:** El sistema operará bajo una arquitectura Cliente-Servidor separada. El Backend será una API RESTful construida con NestJS y TypeORM, y el Frontend será una SPA (Single Page Application) consumidora construida en Vue 3.
*   **RNF6 - Interfaz de Usuario:** El diseño del cliente y panel administrativo debe ser minimalista, optimizado nativamente para Modo Oscuro (Dark Mode), y el módulo de escáner en puerta debe ser *Mobile-First*.
*   **RNF7 - Optimización de Infraestructura (Sin Correos / Sin Almacenamiento S3):** Para minimizar costos operativos del MVP, el sistema no usará servicios SMTP para el envío de boletos. La recuperación visual dependerá del caché del cliente (`localStorage`) o del endpoint de rescate mediante PIN. Los documentos PDF no se guardarán en disco; serán generados "al vuelo" a partir de la BD (StreamableFile).
## RF9 - Personalización B2B (White-Label)
El sistema permite que las organizaciones (Tenants) personalicen su portal de ventas.
- Los administradores pueden establecer un color de marca (`brandColor`) y un dominio personalizado (`customDomain`).
- Estos datos se persisten en una tabla `tenant_configs` relacionada uno-a-uno con el `Tenant`.
