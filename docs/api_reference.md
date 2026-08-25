# TicketRush API Reference

Esta guía rápida documenta los endpoints principales del motor transaccional. Para probar los endpoints interactivamente, levanta el proyecto y visita [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

> **Nota sobre Autenticación:** 
> Los endpoints protegidos requieren enviar el token JWT en las cabeceras HTTP:
> `Authorization: Bearer <TOKEN>`

---

## 🛡️ Autenticación (`/auth`)

### 1. Registrar una nueva empresa (Tenant)
- **POST** `/auth/register-tenant`
- **Auth**: Público
- **Body**:
  ```json
  {
    "tenantName": "Mi Productora",
    "adminEmail": "admin@productora.com",
    "password": "Password123!"
  }
  ```
- **Response** (201): Devuelve el tenant creado y el usuario Admin.

### 2. Iniciar Sesión (Login)
- **POST** `/auth/login`
- **Auth**: Público
- **Body**:
  ```json
  {
    "email": "admin@productora.com",
    "password": "Password123!"
  }
  ```
- **Response** (201): Devuelve el `access_token` JWT.

### 3. Crear miembro Staff (Guardias, Cajeros)
- **POST** `/auth/create-member`
- **Auth**: Requerido (`ADMIN`)
- **Body**:
  ```json
  {
    "email": "puerta1@productora.com",
    "password": "SecurePassword!",
    "role": "STAFF"
  }
  ```

---

## 📅 Eventos y Entradas (`/events` & `/ticket-tiers`)

### 4. Crear Evento
- **POST** `/events`
- **Auth**: Requerido (`ADMIN`)
- **Body**:
  ```json
  {
    "name": "Concierto Épico",
    "date": "2026-12-31T20:00:00.000Z",
    "location": "Estadio Nacional"
  }
  ```

### 5. Listar Eventos
- **GET** `/events`
- **Auth**: Público
- **Response** (200): Lista de eventos globales.

### 6. Crear Categoría de Tickets (Tier)
- **POST** `/ticket-tiers`
- **Auth**: Requerido (`ADMIN`)
- **Body**:
  ```json
  {
    "eventId": "uuid-del-evento",
    "name": "VIP",
    "price": 150.00,
    "capacity": 500,
    "availableStock": 500
  }
  ```

### 7. Listar Tiers de un Evento
- **GET** `/ticket-tiers/event/:eventId`
- **Auth**: Público

---

## 🛒 Compras y Órdenes (`/orders`)

### 8. Comprar Boletos (Motor Transaccional)
- **POST** `/orders`
- **Auth**: Público
- **Headers Requeridos**: 
  - `Idempotency-Key`: UUID o String único (Previene cobros duplicados).
- **Body**:
  ```json
  {
    "clientEmail": "comprador@gmail.com",
    "clientName": "Juan Pérez",
    "tiers": [
      {
        "ticketTierId": "uuid-tier-vip",
        "quantity": 2
      }
    ]
  }
  ```
- **Response** (201):
  ```json
  {
    "success": true,
    "orderStatus": "PAID" 
  }
  ```
> **Nota de Arquitectura**: Este endpoint es completamente atómico. Si se acaban los boletos en medio del procesamiento, devuelve 400 y bloquea las compras. Si es exitoso, envía un webhook asíncrono al Tenant.

---

## 📱 Control de Puerta / Escáner (`/tickets`)

### 9. Validar Boleto en Puerta (Anti-Fraude)
- **POST** `/tickets/validate`
- **Auth**: Requerido (`ADMIN` o `STAFF`)
- **Body**:
  ```json
  {
    "ticketId": "uuid-del-ticket",
    "signature": "hmac-sha256-hash..."
  }
  ```
- **Response** (201):
  ```json
  {
    "success": true,
    "message": "Ticket is VALID. Access granted.",
    "ticket": { ... }
  }
  ```
- **Errores posibles**:
  - `400 Bad Request`: "Invalid or tampered ticket signature" (Fraude detectado).
  - `400 Bad Request`: "Ticket has already been USED" (Replay Attack).
  - `403 Forbidden`: "Ticket belongs to a different Tenant" (Aislamiento B2B).

---

## ⚙️ Configuración B2B (`/tenant-config`)

### 10. Actualizar Webhooks y Diseño
- **PUT** `/tenant-config`
- **Auth**: Requerido (`ADMIN`)
- **Body**:
  ```json
  {
    "webhookUrl": "https://api.productora.com/ticketrush-webhook",
    "customDomain": "tickets.productora.com",
    "brandColor": "#FF5500"
  }
  ```
