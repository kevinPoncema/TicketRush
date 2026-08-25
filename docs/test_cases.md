# 📋 Casos de Prueba (Test Cases) de TicketRush

Esta suite cubre desde flujos estándar (Happy Paths) hasta casos extremos y ataques maliciosos (Edge Cases/Security). Cada prueba aquí descrita debe implementarse garantizando el correcto funcionamiento del motor.

## 1. Módulo de Autenticación y Multi-Tenant (Auth/Tenants)

| ID | Escenario | Resultado Esperado |
| :--- | :--- | :--- |
| **AUTH-01** | `POST /auth/register-tenant` con payload válido. | Retorna 201, crea el Tenant en BD y el usuario Owner con rol ADMIN. |
| **AUTH-02** | `POST /auth/login` con credenciales válidas. | Retorna 201 con el Token JWT generado. |
| **AUTH-03** | `POST /auth/create-member` sin enviar Token JWT. | Lanza HTTP 401 (Unauthorized). |
| **AUTH-04** | `POST /auth/create-member` con token de un empleado (STAFF). | Lanza HTTP 403 (Forbidden). Solo los ADMIN pueden crear staff. |
| **AUTH-05** | `POST /auth/create-member` con token ADMIN válido. | Crea un nuevo usuario y lo vincula estrictamente al mismo `tenantId` del ADMIN. |

## 2. Módulo de Órdenes y Concurrencia (OrderService)

| ID | Escenario | Resultado Esperado |
| :--- | :--- | :--- |
| **ORD-01** | Creación estándar (Happy Path) de una Orden con 2 Tiers distintos. | Orden creada en `PENDING`, stock descontado de la BD, Job agregado a Redis para dentro de 15 minutos. |
| **ORD-02** | Intento de compra sin enviar cabecera `Idempotency-Key`. | Lanza HTTP 400 (Bad Request). |
| **ORD-03** | **Idempotencia:** Se envía el mismo `Idempotency-Key` en dos peticiones separadas por ms. | La segunda petición debe retornar la orden existente generada por la primera, sin restar stock dos veces. |
| **ORD-04** | Intento de compra de un tier sin stock suficiente (`quantity > availableStock`). | Lanza Error "Sold out", se hace rollback total (no se genera orden ni tickets). |
| **ORD-05** | **Test de Fuego (Race Condition):** 5 procesos paralelos (Promise.all) compran el único boleto restante. | Solo 1 recibe la orden completa. Los otros 4 reciben Excepción "Sold out". El stock en BD termina en 0 exacto. |
| **ORD-06** | Prevención de Deadlocks: Compra cruzada de (VIP, General) vs (General, VIP) en paralelo. | No debe producirse un Time-out ni Deadlock en Postgres; el sistema atiende uno y luego el otro sin colgarse. |

## 3. Módulo de Pagos Simulados (ProcessPayment)

| ID | Escenario | Resultado Esperado |
| :--- | :--- | :--- |
| **PAY-01** | El simulador de pago arroja ÉXITO (85% prob). | Orden cambia a `PAID`. Tickets cambian a `VALID`. Se genera criptográficamente el hash `signature` en los tickets. |
| **PAY-02** | El simulador de pago arroja FALLO (15% prob). | Orden cambia a `FAILED`. Tickets cambian a `EXPIRED`. **El sistema le suma (+1) el stock de regreso a cada Tier correspondiente.** |
| **PAY-03** | Intento de llamar a `process-payment` sobre una orden que ya está `PAID`. | Lanza HTTP 400. Evita que un pago se procese o duplique accidentalmente. |

## 4. Liberación Asíncrona (ReserveProcessor - Worker)

| ID | Escenario | Resultado Esperado |
| :--- | :--- | :--- |
| **WRK-01** | Ejecución manual del Worker simulando un payload de BullMQ para una orden en estado `PENDING`. | La orden se cancela (FAILED), tickets expiran (EXPIRED) y el inventario es devuelto a la base de datos de manera agrupada. |
| **WRK-02** | Ejecución del Worker para una orden que ya está `PAID`. | El Worker termina exitosamente imprimiendo un log, y NO toca la base de datos (Idempotencia del Worker). |
| **WRK-03** | Fallo en mitad del proceso del Worker (ej. BD caída en mitad del loop). | El Rollback entra en acción y la orden sigue como PENDING, permitiendo que BullMQ intente ejecutar el job nuevamente más tarde. |

## 5. Control de Puerta y Anti-Fraude (Escáner)

| ID | Escenario | Resultado Esperado |
| :--- | :--- | :--- |
| **SCAN-01** | Envío de ticket y firma HMAC válida (generada por la venta). | Retorna HTTP 200 "Acceso Permitido". El ticket en BD cambia de `VALID` a `USED`. |
| **SCAN-02** | **Replay Attack:** Se re-envía la misma firma válida a los 5 segundos (doble escaneo). | Lanza HTTP 400 "El boleto ya fue USADO anteriormente". |
| **SCAN-03** | **Falsificación:** Se altera un solo carácter en la firma del payload enviado. | El chequeo HMAC rechaza el código por fraude antes de tocar otras lógicas, retorna HTTP 400. |
| **SCAN-04** | **Timing Attack:** Se envía una firma de longitud distinta a la esperada. | El sistema la rechaza instantáneamente antes de pasar por `timingSafeEqual`, impidiendo ataques de medición de tiempo. |
| **SCAN-05** | **Aislamiento B2B:** Empleado (Staff) del Tenant A escanea un ticket válido, pero que pertenece al Tenant B. | Lanza HTTP 403 (Forbidden) impidiendo que eventos ajenos se crucen en puertas distintas. |
| **SCAN-06** | Intento de escanear un ticket en estado `EXPIRED` o `RESERVED` (pagos fallidos o sin finalizar). | Lanza HTTP 400 indicando que el ticket no es válido para ingreso en este momento. |
