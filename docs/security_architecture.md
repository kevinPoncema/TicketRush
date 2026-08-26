# Arquitectura de Seguridad y Criptografía

El motor de ticketing B2B (TicketRush / Vantage) incorpora múltiples capas de seguridad diseñadas para proteger la autenticidad de los boletos, los datos de los *Tenants* y el flujo de los pagos.

## 1. Criptografía de Boletos (Anti-Fraude)
El problema principal en la industria del ticketing es la falsificación de códigos QR (capturas de pantalla manipuladas). TicketRush soluciona esto aislando la validación visual de la criptográfica:

- **Firma HMAC-SHA256:** Cuando una orden es pagada, el sistema genera los `Tickets`. A cada ticket se le asigna un UUID único y una `signature` (Firma Criptográfica) generada con el secreto del servidor (`HMAC_SECRET`).
- **Validación del Escáner:** Al escanear el QR, la aplicación no solo revisa que el UUID del ticket exista en la base de datos, sino que recalcula la firma criptográfica en el backend. Si alguien adivina un UUID válido pero no tiene la firma correcta generada por el servidor, el acceso es **denegado**.
- **Inmutabilidad:** Un boleto en estado `USED` no puede ser escaneado por segunda vez, bloqueando intentos de reventa ilegal de capturas de pantalla de boletos válidos.

## 2. Recuperación de Boletos (Access PIN)
Para mejorar la experiencia de usuario (UX) sin requerir que los compradores B2C creen cuentas obligatorias, se implementó un sistema de **Access PIN**:
- Al crear una orden, se genera un PIN alfanumérico seguro (Ej: `A1B2C3`).
- Si el cliente pierde el correo con sus boletos, puede ingresar a la tienda del evento, proveer su correo electrónico y su Access PIN para visualizar y descargar sus PDFs. 
- Esto evita la filtración de datos masiva si alguien malintencionado intentara extraer las órdenes solo conociendo el correo electrónico de otra persona.

## 3. Aislamiento de Tenants (Multitenancy)
La arquitectura asegura que los datos de diferentes productoras no se filtren ni se intercepten:
- Las rutas del Dashboard B2B (`/tenants`, `/tenant-config`, `/analytics`) están protegidas por `AuthMiddleware` y `RolesGuard`. Solo los usuarios con rol `ADMIN` pueden modificar configuraciones, y solo operan sobre el `tenant_id` atado a su JWT.
- Las rutas públicas B2C (`/public/(.*)`) están exentas del middleware de JWT, operando bajo un esquema REST *Read-Only* seguro que expone únicamente lo necesario (Colores, Logos, Banners e información del Evento).
