# Gestión de Transacciones y Concurrencia (TicketRush)

Este documento detalla el motor transaccional de TicketRush, diseñado específicamente para soportar escenarios de alta demanda masiva (ej. salida a la venta de boletos de un concierto) garantizando **Cero Sobreventa** (Zero Overselling).

## 1. Arquitectura de Transacciones (QueryRunner)

En NestJS con TypeORM, el uso de repositorios inyectados tradicionalmente (`@InjectRepository`) funciona bajo conexiones auto-gestionadas por operación. Sin embargo, para agrupar múltiples consultas en una sola unidad lógica de trabajo ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad), TicketRush emplea el patrón de **QueryRunner**.

### Flujo Típico en un Servicio (`OrderService`):
1. Se obtiene una conexión dedicada del Pool: `dataSource.createQueryRunner()`.
2. Se inicia explícitamente el túnel: `queryRunner.startTransaction()`.
3. Se ejecutan todas las operaciones pasando `queryRunner.manager` hacia la capa de Repositorios.
4. Si todo es exitoso, se confirma: `queryRunner.commitTransaction()`.
5. Si ocurre cualquier excepción (Stock insuficiente, error de red), el bloque `catch` ejecuta `queryRunner.rollbackTransaction()`.
6. El bloque `finally` libera la conexión de vuelta al pool: `queryRunner.release()`.

## 2. Inyección Dinámica en Repositorios Custom

Para mantener el principio de *Separación de Responsabilidades* (Clean Architecture) sin sacrificar el alcance de la transacción, todos los repositorios personalizados (`TicketTierRepository`, `OrderRepository`, etc.) fueron diseñados para recibir un `EntityManager` de forma opcional.

```typescript
// Ejemplo en TicketTierRepository
private getRepo(manager?: EntityManager) {
  // Si viene un manager transaccional, se usa. Si no, se usa el repo global.
  return manager ? manager.getRepository(TicketTier) : this.repository;
}
```

Esto permite que los controladores llamen a métodos simples, pero que servicios complejos como `createOrder` envuelvan las operaciones del repositorio en el mismo candado de la base de datos.

## 3. Prevención de Sobreventa (Pessimistic Locking)

Cuando un usuario intenta comprar un boleto, el sistema no solo consulta el stock (`SELECT`), sino que "congela" la fila en PostgreSQL utilizando la directiva de TypeORM: `lock: { mode: 'pessimistic_write' }`.

Traducción a SQL:
```sql
SELECT * FROM ticket_tiers WHERE id = 'xyz' FOR UPDATE;
```
Cualquier otro cliente que intente comprar el mismo tipo de entrada quedará en espera (bloqueado a nivel de base de datos) milisegundos hasta que la primera transacción confirme o se cancele. Esto hace que sea matemáticamente imposible sobrevender un TicketTier.

## 4. Prevención de Deadlocks (Abrazos Mortales)

Dado que las compras pueden incluir múltiples *TicketTiers* en una sola orden (ej. 2 VIP y 1 General), existe el riesgo de un **Deadlock**. 
- Si el Cliente A bloquea "VIP" y busca bloquear "General".
- Y simultáneamente, el Cliente B bloquea "General" y busca bloquear "VIP".
- Ambos procesos se quedarán esperando eternamente.

**Solución Implementada:**
TicketRush ordena algorítmicamente la lista de peticiones en memoria **antes** de ir a la Base de Datos.
```typescript
const sortedTiers = [...tiers].sort((a, b) => a.ticketTierId.localeCompare(b.ticketTierId));
```
Al iterar secuencialmente (con un `for...of` síncrono), forzamos a que todos los hilos de Node.js soliciten los bloqueos en la base de datos **exactamente en el mismo orden**, eliminando por completo la posibilidad de Deadlocks.

## 5. Soft Reserve y BullMQ (Redis)

TicketRush no exige que el pago sea instantáneo. Una vez generada la orden (estado `PENDING`) y emitidos los tickets (estado `RESERVED`), se considera una **Soft Reserve**.
1. Se dispara un evento a Redis mediante BullMQ (`reserve-queue`).
2. Se le indica a BullMQ que espere exactamente **15 minutos**.
3. Pasados los 15 minutos, el `ReserveProcessor` (Worker) despierta.
4. El Worker abre una transacción, bloquea la orden, y si ésta sigue en `PENDING` (no fue pagada), procede a liberar el inventario:
   - Marca la orden como `FAILED`.
   - Marca los tickets como `EXPIRED`.
   - Devuelve las unidades al `availableStock` (usando bloqueo pesimista).
