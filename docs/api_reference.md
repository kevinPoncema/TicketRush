# VANTAGE — API Reference

> **Versión:** 2.0 | **Última actualización:** 2026-08-25  
> Documentación interactiva Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## Autenticación

Los endpoints protegidos requieren un token JWT en cada petición:

\`\`\`http
Authorization: Bearer <TOKEN>
\`\`\`

> El token se obtiene en \`POST /auth/login\`. Contiene el \`tenantId\` y el \`role\` del usuario, habilitando el aislamiento multi-tenant en todos los recursos protegidos.

---

## Índice de Endpoints

| # | Método | Ruta | Auth | Descripción |
|---|--------|------|------|-------------|
| 1 | \`POST\` | \`/auth/register-tenant\` | Público | Registrar organización |
| 2 | \`POST\` | \`/auth/login\` | Público | Iniciar sesión |
| 3 | \`POST\` | \`/auth/create-member\` | \`ADMIN\` | Crear miembro staff |
| 4 | \`POST\` | \`/events\` | \`ADMIN\` | Crear evento |
| 5 | \`GET\` | \`/events?tenantId=\` | Público | Listar todos los eventos de un tenant |
| 6 | \`GET\` | \`/events/public/tenant/:tenantId\` | Público | **Tienda pública: eventos próximos** |
| 7 | \`GET\` | \`/events/:id\` | Público | Obtener evento con sus tiers |
| 8 | \`PUT\` | \`/events/:id\` | \`ADMIN\` | Actualizar evento |
| 9 | \`DELETE\` | \`/events/:id\` | \`ADMIN\` | Eliminar evento |
| 10 | \`GET\` | \`/ticket-tiers/event/:eventId\` | Público | Listar tiers de un evento |
| 11 | \`POST\` | \`/ticket-tiers\` | \`ADMIN\` | Crear tier de boleto |
| 12 | \`PUT\` | \`/ticket-tiers/:id\` | \`ADMIN\` | Actualizar tier |
| 13 | \`DELETE\` | \`/ticket-tiers/:id\` | \`ADMIN\` | Eliminar tier |
| 14 | \`POST\` | \`/orders\` | Público | Comprar boletos (motor transaccional) |
| 15 | \`POST\` | \`/orders/recover\` | Público | Recuperar orden por Email + PIN |
| 16 | \`GET\` | \`/orders/:id/pdf\` | Público* | Descargar PDF de la orden |
| 17 | \`POST\` | \`/orders/:id/process-payment\` | Público | Procesar pago simulado |
| 18 | \`POST\` | \`/orders/:id/cancel\` | Público | Cancelar orden pendiente |
| 19 | \`POST\` | \`/tickets/validate\` | \`ADMIN\`/\`STAFF\` | Validar boleto en puerta |
| 20 | \`GET\` | \`/tenant-config\` | \`ADMIN\` | Obtener configuración del tenant |
| 21 | \`PUT\` | \`/tenant-config\` | \`ADMIN\` | Crear/Actualizar configuración |
| 22 | \`DELETE\` | \`/tenant-config\` | \`ADMIN\` | Eliminar configuración |

---

## 🛡️ Autenticación (\`/auth\`)

### 1. Registrar Organización (Tenant)

\`\`\`http
POST /auth/register-tenant
\`\`\`

- **Auth:** Público
- **Body:**
  \`\`\`json
  {
    "tenantName": "Mi Productora",
    "adminEmail": "admin@productora.com",
    "password": "Password123!"
  }
  \`\`\`
- **Response 201:** Devuelve el tenant creado con su \`tenantId\` y el usuario Admin.

---

### 2. Iniciar Sesión

\`\`\`http
POST /auth/login
\`\`\`

- **Auth:** Público
- **Body:**
  \`\`\`json
  {
    "email": "admin@productora.com",
    "password": "Password123!"
  }
  \`\`\`
- **Response 201:**
  \`\`\`json
  { "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
  \`\`\`

---

### 3. Crear Miembro Staff

\`\`\`http
POST /auth/create-member
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Body:**
  \`\`\`json
  {
    "email": "puerta1@productora.com",
    "password": "SecurePassword!",
    "role": "STAFF"
  }
  \`\`\`
- **Response 201:** Devuelve el nuevo usuario con su rol.

---

## 📅 Eventos (\`/events\`)

### 4. Crear Evento

\`\`\`http
POST /events
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Body:**
  \`\`\`json
  {
    "name": "Concierto Épico",
    "date": "2026-12-31T20:00:00.000Z",
    "location": "Estadio Nacional"
  }
  \`\`\`
- **Response 201:** El evento creado con \`id\`, \`tenantId\` y \`createdAt\`.

---

### 5. Listar Todos los Eventos del Tenant

\`\`\`http
GET /events?tenantId=<uuid>
\`\`\`

- **Auth:** Público
- **Query Param:** \`tenantId\` (requerido)
- **Response 200:** Array de todos los eventos (pasados y futuros) con sus tiers.

---

### 6. 🆕 Tienda Pública — Eventos Próximos del Tenant

\`\`\`http
GET /events/public/tenant/:tenantId
\`\`\`

- **Auth:** Público
- **Params:** \`tenantId\` — UUID del tenant/organización.
- **Comportamiento:**
  - Retorna **solo** eventos con \`date >= NOW()\`.
  - Ordenados por fecha **ascendente** (el más próximo primero).
  - Incluye tiers con stock disponible y descripción.
- **Response 200:**
  \`\`\`json
  [
    {
      "id": "uuid",
      "name": "Neon Nights Festival",
      "date": "2026-12-31T20:00:00.000Z",
      "location": "Arena VANTAGE",
      "ticketTiers": [
        {
          "id": "uuid-tier",
          "name": "General",
          "price": "45.00",
          "capacity": 500,
          "availableStock": 312,
          "description": "Acceso a todas las áreas públicas."
        }
      ]
    }
  ]
  \`\`\`

> **Nota:** Este endpoint alimenta la landing pública del organizador (\`/org/:tenantId\` en el frontend). Es el punto de entrada del flujo B2C completo.

---

### 7. Obtener un Evento (Público)

\`\`\`http
GET /events/:id
\`\`\`

- **Auth:** Público
- **Response 200:** El evento con sus tiers y stock actual. Usado en la página de compra individual (\`/e/:id\`).

---

### 8. Actualizar Evento

\`\`\`http
PUT /events/:id
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Body:** Todos los campos son opcionales:
  \`\`\`json
  { "name": "Nuevo Nombre", "date": "2027-01-15T21:00:00.000Z", "location": "Nuevo Venue" }
  \`\`\`

---

### 9. Eliminar Evento

\`\`\`http
DELETE /events/:id
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Response 204:** Sin contenido.

---

## 🎟️ Tiers de Boletos (\`/ticket-tiers\`)

### 10. Listar Tiers de un Evento

\`\`\`http
GET /ticket-tiers/event/:eventId
\`\`\`

- **Auth:** Público
- **Response 200:** Array de tiers con precio, capacidad, stock y descripción.

---

### 11. Crear Tier de Boleto

\`\`\`http
POST /ticket-tiers
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Body:**
  \`\`\`json
  {
    "eventId": "uuid-del-evento",
    "name": "VIP Backstage",
    "price": 150.00,
    "capacity": 100,
    "availableStock": 100,
    "description": "Acceso al área VIP, barra libre y meet & greet."
  }
  \`\`\`
  > \`description\` es **opcional**. Si se omite, el frontend muestra un texto genérico de fallback.

- **Response 201:** El tier creado con su \`id\`.

---

### 12. Actualizar Tier

\`\`\`http
PUT /ticket-tiers/:id
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Body:** Todos los campos son opcionales:
  \`\`\`json
  {
    "name": "Early Bird",
    "price": 30.00,
    "capacity": 200,
    "availableStock": 87,
    "description": "Precio especial de lanzamiento."
  }
  \`\`\`

---

### 13. Eliminar Tier

\`\`\`http
DELETE /ticket-tiers/:id
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\`)
- **Response 204:** Sin contenido.

---

## 🛒 Órdenes de Compra (\`/orders\`)

### 14. Comprar Boletos (Motor Transaccional)

\`\`\`http
POST /orders
Idempotency-Key: <UUID único>
\`\`\`

- **Auth:** Público
- **Headers Requeridos:**
  - \`Idempotency-Key\` — UUID único por intento de compra. **Obligatorio.**
- **Body:**
  \`\`\`json
  {
    "clientEmail": "comprador@gmail.com",
    "clientName": "Juan Pérez",
    "tiers": [
      { "ticketTierId": "uuid-tier-general", "quantity": 2 },
      { "ticketTierId": "uuid-tier-vip", "quantity": 1 }
    ]
  }
  \`\`\`
- **Response 201:**
  \`\`\`json
  { "success": true, "orderStatus": "PAID" }
  \`\`\`
- **Errores:**
  - \`400\` — \`Idempotency-Key header is strictly required\`
  - \`400\` — Stock insuficiente para completar la orden.

> **Nota de Arquitectura:** Este endpoint es **atómico**. Usa una transacción de base de datos: si el stock se agota durante el procesamiento, toda la operación se revierte. Si tiene éxito, dispara un webhook asíncrono al Tenant.

---

### 15. Recuperar Orden (El Salvavidas)

\`\`\`http
POST /orders/recover
\`\`\`

- **Auth:** Público (Rate-Limited)
- **Body:**
  \`\`\`json
  {
    "email": "comprador@gmail.com",
    "accessPin": "X7K2QA"
  }
  \`\`\`
- **Response 200:** La orden completa con todos sus tickets y QR payloads.

> **Caso de uso:** Permite a compradores recuperar sus boletos si borraron la caché, cambiaron de dispositivo o perdieron acceso. No requiere cuenta ni correo electrónico previo.

---

### 16. Descargar PDF de Boletos

\`\`\`http
GET /orders/:id/pdf?email=<email>&accessPin=<pin>
\`\`\`

- **Auth:** Público* (validado por email + PIN, Rate-Limited)
- **Query Params:**
  - \`email\` — Correo del comprador.
  - \`accessPin\` — PIN de 6 caracteres de la confirmación de compra.
- **Response 200:** Stream \`application/pdf\` descargable como \`ticketrush-order-{id}.pdf\`.
- **Errores:**
  - \`400\` — \`ID mismatch\` si el orderId no corresponde al email/PIN.

---

### 17. Procesar Pago (Simulación)

\`\`\`http
POST /orders/:id/process-payment
\`\`\`

- **Auth:** Público
- **Descripción:** Transiciona la orden de \`PENDING\` a \`PAID\`. En producción, este paso lo disparará el proveedor de pagos (Stripe, etc.) vía webhook.
- **Response 201:** Orden actualizada con \`status: "PAID"\`.

---

### 18. Cancelar Orden

\`\`\`http
POST /orders/:id/cancel
\`\`\`

- **Auth:** Público
- **Descripción:** Cancela una orden si su estado es \`PENDING\`. Restaura el stock de los tiers afectados.
- **Response 201:** Orden actualizada con \`status: "CANCELLED"\`.

---

## 📱 Escáner de Puerta (\`/tickets\`)

### 19. Validar Boleto

\`\`\`http
POST /tickets/validate
Authorization: Bearer <TOKEN>
\`\`\`

- **Auth:** Requerido (\`ADMIN\` o \`STAFF\`)
- **Body:**
  \`\`\`json
  {
    "ticketId": "uuid-del-ticket",
    "signature": "hmac-sha256-hash-del-payload"
  }
  \`\`\`
- **Response 200:**
  \`\`\`json
  {
    "success": true,
    "message": "Ticket is VALID. Access granted.",
    "ticket": { "id": "...", "status": "USED" }
  }
  \`\`\`
- **Errores:**

  | Código | Mensaje | Causa |
  |--------|---------|-------|
  | \`400\` | \`Invalid or tampered ticket signature\` | Fraude — firma HMAC inválida |
  | \`400\` | \`Ticket has already been USED\` | Replay Attack — reutilización de QR |
  | \`403\` | \`Ticket belongs to a different Tenant\` | Aislamiento B2B violado |

---

## ⚙️ Configuración del Tenant (\`/tenant-config\`)

> Todos los endpoints de esta sección requieren \`Authorization: Bearer <TOKEN>\` con rol \`ADMIN\`.

### 20. Obtener Configuración

\`\`\`http
GET /tenant-config
Authorization: Bearer <TOKEN>
\`\`\`

- **Response 200:**
  \`\`\`json
  {
    "webhookUrl": "https://api.productora.com/webhook",
    "customDomain": "tickets.productora.com",
    "brandColor": "#FF5500"
  }
  \`\`\`

---

### 21. Crear/Actualizar Configuración (Upsert)

\`\`\`http
PUT /tenant-config
Authorization: Bearer <TOKEN>
\`\`\`

- **Body:** Todos los campos son opcionales:
  \`\`\`json
  {
    "webhookUrl": "https://api.productora.com/webhook",
    "customDomain": "tickets.productora.com",
    "brandColor": "#FF5500"
  }
  \`\`\`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| \`webhookUrl\` | \`string\` (URL) | Endpoint que recibe notificaciones de venta |
| \`customDomain\` | \`string\` | Dominio personalizado para la tienda pública |
| \`brandColor\` | \`string\` (HEX) | Color primario para white-label UI |

- **Response 200:** La configuración actualizada.

---

### 22. Eliminar Configuración

\`\`\`http
DELETE /tenant-config
Authorization: Bearer <TOKEN>
\`\`\`

- **Response 200:** Confirmación de eliminación.

---

## Mapa de Flujos

\`\`\`
B2B (Organizador)
  POST /auth/register-tenant
    └── POST /auth/login  ──► JWT Token
          ├── POST /events            (crear eventos)
          │     └── POST /ticket-tiers  (crear tiers con descripción)
          └── PUT /tenant-config      (webhooks, dominio, branding)

B2C (Comprador)
  GET /events/public/tenant/:tenantId   (tienda de la organización)
    └── GET /events/:id                 (detalle del evento + tiers + stock)
          └── POST /orders              (comprar + Idempotency-Key)
                ├── POST /orders/recover       (el salvavidas: Email + PIN)
                └── GET /orders/:id/pdf        (descargar boletos en PDF)

Operación de Campo (Staff)
  POST /auth/create-member     (crear guardias/staff)
    └── POST /tickets/validate (escanear QR en puerta con firma HMAC)
\`\`\`

---

## Notas de Arquitectura

**Idempotency-Key obligatorio en /orders:**  
Si el frontend lo omite, la API devuelve \`400\` inmediatamente. Esto previene cobros duplicados en caso de reintentos de red o doble-clic del usuario.

**description en ticket-tiers es nullable:**  
La columna es \`nullable: true\` en la base de datos. Si no se envía, el frontend muestra automáticamente el texto genérico de "acceso oficial". No rompe la API ni requiere migración.

**El endpoint /events/public/tenant/:tenantId filtra por fecha en la DB:**  
Usa un QueryBuilder con \`WHERE event.date >= NOW()\` en Postgres, lo que garantiza que la tienda pública nunca muestre eventos ya celebrados, independientemente de cuántos eventos tenga el tenant.

**Aislamiento multi-tenant en validación de puerta:**  
El guard compara el \`tenantId\` del JWT del scanner con el \`tenantId\` del ticket. Un guardia de una organización no puede validar boletos de otra, retornando \`403\` inmediatamente.
