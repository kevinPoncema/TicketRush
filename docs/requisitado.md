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

---

## 🌟 Funcionalidades Extra (Mejoras Post-Requisitos)

Durante el ciclo de desarrollo se implementaron las siguientes mejoras de calidad de vida y funcionalidades avanzadas que **no estaban contempladas en los requisitos originales**, pero que añaden valor directo al producto:

*   **FE1 - Escáner de Puerta con Efecto Espejo (Mirror-Mode):** Se añadió una transformación visual (`transform: scaleX(-1)`) a la cámara en `StaffScannerView` para eliminar la disonancia cognitiva del staff al mover el dispositivo, logrando una experiencia natural sin alterar la lectura real del QR.
*   **FE2 - Generador Nativo de QRs (Sin APIs Externas):** Se reemplazó el uso de `api.qrserver.com` por la librería `qrcode.vue` instalada localmente, permitiendo que la vista web de "Éxito" dibuje las firmas criptográficas en tiempo real y offline (mejorando la privacidad y tiempo de carga).
*   **FE3 - Estandarización y Retrocompatibilidad de QRs:** El sistema fue mejorado para que los QRs inyecten un JSON estructurado (`{ ticketId, signature }`). Adicionalmente, el escáner de la puerta se dotó de "retrocompatibilidad", haciéndolo capaz de traducir en tiempo real formatos de payload antiguos sin romper la validación estricta de NestJS.
*   **FE4 - Interceptor Global Anti-Ghosting (401):** Se creó una regla global en el cliente Axios/Fetch (`api.ts`) que intercepta cualquier error `401 Unauthorized`. Si el token expira mientras la pantalla del escáner está abierta, el sistema limpia los cachés sucios y expulsa al usuario al Login automáticamente conservando el `?redirect`.
*   **FE5 - Soporte Multidivisa Dinámico:** La tienda pública B2C detecta la configuración del Tenant y cambia automáticamente el símbolo y código de la moneda (USD, EUR, MXN, etc.) renderizado en los precios.
*   **FE6 - Barra de Inventario Matemática Precisa:** La barra de escasez de boletos en la tienda se reescribió para abandonar anchos "falsos" (25%, 50%). Ahora calcula milimétricamente el progreso en tiempo real (`availableStock / capacity * 100`).
*   **FE7 - Dashboard Analítico B2B (ApexCharts):** Se desarrolló un panel de inteligencia de negocios con gráficas de área y anillos reales que consultan de forma nativa las ventas (Total Sold, Total Revenue) directamente desde PostgreSQL.
*   **FE8 - Expansión del Motor de Webhooks:** El procesador de BullMQ se potenció para no solo emitir eventos de `ORDER_COMPLETED`, sino también notificar a los sistemas externos cuando un carrito caduca por falta de pago (`ORDER_EXPIRED`) o cuando el organizador lo cancela manualmente (`ORDER_CANCELLED`).
