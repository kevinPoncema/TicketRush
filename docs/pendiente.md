# Pendientes de Integración — Frontend vs Backend

> **Fecha:** 2026-08-25  
> **Estado:** En progreso. Este documento registra todo lo que aún usa datos simulados,
> hardcodeados o comportamientos provisionales en el frontend, y el motivo por el que
> no se pudo conectar a la API real.

---

## 🔴 Críticos (bloquean funcionalidad real)

### 1. `GET /auth/members` — Listado de Staff No Existe
- **Archivo:** [`src/views/b2b/StaffManagerView.vue`](../frontend/src/views/b2b/StaffManagerView.vue)
- **Servicio:** [`src/services/auth.service.ts`](../frontend/src/services/auth.service.ts) → `listMembers()`
- **Comportamiento actual:** Devuelve un array vacío `[]` siempre. La tabla de miembros aparece vacía con un mensaje explicativo.
- **Lo que falta en el backend:** Implementar `GET /auth/members` (protegido por ADMIN) que devuelva los usuarios del tenant.
- **Impacto:** El organizador no puede ver su lista de staff desde el panel.

### 2. `DELETE /auth/member/:id` — Eliminar Staff No Existe
- **Archivo:** [`src/views/b2b/StaffManagerView.vue`](../frontend/src/views/b2b/StaffManagerView.vue)
- **Comportamiento actual:** Muestra un alert de "próximamente" al hacer clic en Eliminar.
- **Lo que falta en el backend:** Implementar `DELETE /auth/member/:id` (protegido por ADMIN).
- **Impacto:** El organizador no puede revocar acceso a miembros del staff.

### 3. Flujo de Pago — Sin Pasarela Real
- **Archivos:** [`src/views/b2c/CheckoutView.vue`](../frontend/src/views/b2c/CheckoutView.vue)
- **Comportamiento actual:** El formulario de tarjeta es una UI fake. Se llama directamente a `POST /orders` (que crea la orden como PAID en simulación) sin pasar por un proveedor de pagos real.
- **Lo que falta:** Integrar Stripe, MercadoPago u otro proveedor. El endpoint `POST /orders/:id/process-payment` está preparado para recibir el webhook del proveedor.
- **Impacto:** No se puede cobrar dinero real. Funciona perfectamente para demos y pruebas.

### 4. Vista de Éxito — Datos de la Orden sin Endpoint Dedicado
- **Archivo:** [`src/views/b2c/SuccessView.vue`](../frontend/src/views/b2c/SuccessView.vue)
- **Comportamiento actual:** Lee desde `localStorage` bajo la clave `order_success_{orderId}` que se graba en el checkout. Si el usuario abre el enlace en otro dispositivo/sesión, lo redirige a `/recover`.
- **Lo que falta:** Un endpoint `GET /orders/:id?email=...&accessPin=...` que devuelva el detalle completo de la orden sin autenticación JWT (igual que el PDF). Esto permitiría mostrar los boletos desde cualquier dispositivo con solo el orderId + PIN.
- **Workaround actual:** El usuario debe usar `/recover` para rehidratar la vista de éxito desde otro dispositivo.

---

## 🟡 Parciales (funcionan pero con limitaciones)

### 5. Métricas del Dashboard — Sin Datos Reales
- **Archivo:** [`src/views/b2b/DashboardHomeView.vue`](../frontend/src/views/b2b/DashboardHomeView.vue)
- **Comportamiento actual:** Las tarjetas de "Ingresos Totales", "Tickets Vendidos" y "Tasa de Conversión" fueron **eliminadas** del dashboard al no tener un endpoint de analytics en el backend.
- **Lo que falta:** Un endpoint de resumen, ej. `GET /analytics/summary` que devuelva métricas del tenant.
- **Impacto:** El dashboard solo muestra la lista de eventos (datos reales). No hay métricas.

### 6. Nombre de la Organización en `OrgLandingView` — Derivado del tenantId
- **Archivo:** [`src/views/b2c/OrgLandingView.vue`](../frontend/src/views/b2c/OrgLandingView.vue)
- **Comportamiento actual:** El nombre de la org se deriva del `tenantId` (reemplazando guiones por espacios en mayúsculas). Ej: `tenant-demo-001` → `TENANT DEMO 001`.
- **Lo que falta:** El backend podría exponer `GET /public/tenant/:tenantId/info` con `{ name, logoUrl, brandColor }` para personalizar la landing pública.
- **Impacto:** Las landings de organizaciones muestran el tenantId formateado en lugar del nombre real de la productora.

### 7. Imagen de Portada de Eventos — Hardcodeada (Unsplash)
- **Archivos:** 
  - [`src/views/b2c/OrgLandingView.vue`](../frontend/src/views/b2c/OrgLandingView.vue)
  - [`src/views/b2c/EventDetailView.vue`](../frontend/src/views/b2c/EventDetailView.vue)
- **Comportamiento actual:** Todos los eventos muestran la misma foto de Unsplash como banner genérico.
- **Lo que falta:** El modelo `Event` debería incluir un campo `bannerUrl` (o similar) y el backend exponer un endpoint de subida de imágenes.
- **Impacto:** Visual: todos los eventos se ven iguales. No hay diferenciación de marca por evento.

### 8. QR Code en SuccessView — Generado por Servicio Externo
- **Archivo:** [`src/views/b2c/SuccessView.vue`](../frontend/src/views/b2c/SuccessView.vue)
- **Comportamiento actual:** El QR visible en pantalla se genera usando la API pública `api.qrserver.com` con el dato `{orderId}-{ticketIndex}`. Este QR **no es el QR real del ticket** (el QR real contiene `ticketId` + firma HMAC).
- **Lo que falta:** El backend debe exponer el `qrPayload` (el JSON con `ticketId` y `signature`) por orden en el response de `POST /orders/recover` o en un campo dedicado del order.
- **Impacto:** Los QRs mostrados en la pantalla de éxito son visuales/demo. El PDF descargado sí usa los QRs reales (generados por el backend).

### 9. Indicador de Stock en `EventDetailView` — Usa `availableStock` Real
- **Archivo:** [`src/views/b2c/EventDetailView.vue`](../frontend/src/views/b2c/EventDetailView.vue)
- **Comportamiento actual:** ✅ Ya usa `availableStock` de la API real. Sin embargo, el indicador de escasez (barra de progreso) muestra porcentajes fijos (1/4, 2/4, 3/4) en lugar de un porcentaje calculado sobre `capacity`.
- **Lo que falta:** El API debería devolver `capacity` junto a `availableStock` para calcular `(availableStock/capacity)*100`.
- **Impacto:** La barra de progreso es aproximada, no exacta.

---

## 🟢 Completamente Reemplazados (API Real Activa)

| Funcionalidad | Endpoint | Archivo |
|---|---|---|
| Registro de tenant | `POST /auth/register-tenant` | `RegisterTenantView.vue` + `auth.store.ts` |
| Login / JWT decode | `POST /auth/login` | `LoginView.vue` + `auth.store.ts` |
| Crear staff | `POST /auth/create-member` | `StaffManagerView.vue` |
| CRUD de eventos (lista) | `GET /events?tenantId=` | `DashboardHomeView.vue`, `EventListView.vue` |
| CRUD de eventos (crear) | `POST /events` + `POST /ticket-tiers` | `EventEditorView.vue` |
| CRUD de eventos (editar) | `PUT /events/:id` + `PUT /ticket-tiers/:id` | `EventEditorView.vue` |
| Obtener evento individual | `GET /events/:id` | `EventDetailView.vue` |
| Tienda pública del tenant | `GET /events/public/tenant/:tenantId` | `OrgLandingView.vue` |
| Crear orden de compra | `POST /orders` + `Idempotency-Key` | `CheckoutView.vue` |
| Recuperar orden por PIN | `POST /orders/recover` | `RecoverTicketsView.vue` |
| Descarga de PDF | `GET /orders/:id/pdf?email&accessPin` | `SuccessView.vue` |
| Configuración del tenant | `GET /tenant-config` + `PUT /tenant-config` | `IntegrationsView.vue` |
| Validación de QR | `POST /tickets/validate` (HMAC) | `StaffScannerView.vue` |

---

## 📋 Próximos Pasos Recomendados

1. **Backend:** Implementar `GET /auth/members` y `DELETE /auth/member/:id`
2. **Backend:** Añadir `qrPayload` al response de `POST /orders/recover`  
3. **Backend:** Considerar `GET /orders/:id` público (con email+PIN) para SuccessView multi-dispositivo
4. **Backend:** Endpoint de analytics `GET /analytics/summary` para las métricas del dashboard
5. **Frontend:** Integrar pasarela de pago real (Stripe) en CheckoutView
6. **Backend/Frontend:** Sistema de subida de imágenes para banner del evento
