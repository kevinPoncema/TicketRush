# 🧪 Arquitectura y Estrategia de Testing (TicketRush)

Este documento define la estrategia definitiva para probar un sistema transaccional de alta concurrencia. Aquí no diseñamos pruebas de "juguete" que solo pintan la consola de verde; construimos simulaciones reales de estrés para asegurar que el motor soporte la demanda en producción.

---

## 1. El Mandamiento Cero: Prohibido SQLite 🚫

Muchos tutoriales sugieren usar bases de datos en memoria (SQLite) para acelerar las pruebas. **Para TicketRush, esto es un error fatal**. 

SQLite maneja los bloqueos de lectura/escritura de forma diametralmente opuesta a PostgreSQL. Funciones críticas de nuestro sistema como `FOR UPDATE` (Pessimistic Locking) o el ordenamiento para prevención de Deadlocks simplemente no se evaluarán de forma realista.

**Solución:** 
Se utilizará una instancia real de **PostgreSQL exclusiva para testing** (ej. `ticketrush_test`). Lo ideal es levantarla efímeramente utilizando **Testcontainers** durante los pipelines de CI/CD, asegurando que el entorno de pruebas es idéntico a producción.

---

## 2. La Prueba de Fuego: Concurrencia Extrema (Race Conditions) 🔥

El test más crítico de toda la aplicación no verifica si el endpoint responde 200, verifica si nuestro candado transaccional resiste a la realidad. 

Simularemos un ataque de concurrencia donde 5 peticiones independientes intentan comprar exactamente el **último boleto disponible** exactamente en el mismo milisegundo.

```typescript
it('debería evitar la sobreventa cuando 5 usuarios compran el último boleto a la vez', async () => {
  // 1. Setup: Modificamos la DB para que solo quede 1 boleto
  await tierRepo.update(tierId, { availableStock: 1 });

  // 2. Disparamos 5 peticiones SIMULTÁNEAS (Node.js lanzará todas de golpe)
  const attempts = Array.from({ length: 5 }).map((_, i) => 
    orderService.createOrder({
      clientEmail: `user${i}@test.com`,
      clientName: `User ${i}`,
      tiers: [{ ticketTierId: tierId, quantity: 1 }]
    }, `idempotency-key-${i}`).catch(e => e) // Atrapamos el error interno
  );

  const results = await Promise.all(attempts);

  // 3. Evaluamos la batalla campal
  const successOrders = results.filter(r => !(r instanceof Error) && !r.message);
  const failedOrders = results.filter(r => r instanceof Error || r.message);

  // 4. Aserciones de Oro
  expect(successOrders).toHaveLength(1); // ¡Solo 1 transacción debió adquirir el Lock!
  expect(failedOrders).toHaveLength(4);  // ¡Las otras 4 rebotaron por falta de stock!
  
  // 5. Verificamos que la BD está íntegra
  const finalTier = await tierRepo.findById(tierId);
  expect(finalTier.availableStock).toBe(0); // Ni números negativos, ni sobreventa.
});
```

---

## 3. Aislamiento de Colas Asíncronas (Redis/BullMQ) ⏱️

Una suite de pruebas debe correr en segundos. No podemos pausar el runner de Jest por 15 minutos esperando que una orden expire. **BullMQ es el único elemento que debemos mockear.**

Interceptaremos la inyección de dependencias de NestJS reemplazando la cola de Redis por una función espía (Spy):

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [OrderService, ...repos],
})
.overrideProvider(getQueueToken('reserve-queue'))
.useValue({
  add: jest.fn(), // Interceptamos y espiamos
})
.compile();

// En el test:
it('debería encolar el trabajo de expiración', async () => {
  await orderService.createOrder(...);
  // Comprobamos que el servicio intentó despachar el Job a BullMQ sin dispararlo realmente
  expect(mockQueue.add).toHaveBeenCalledWith(
    'expire-order', 
    expect.any(Object), 
    { delay: 900000 } // 15 minutos exactos
  );
});
```

---

## 4. Testeando el Procesador (Worker) de manera aislada 🧪

Dado que bloqueamos a BullMQ en el paso anterior, ¿cómo probamos que el Worker devuelve el inventario si la orden fracasa? Tratándolo como lo que es: **una simple clase TypeScript**.

Inyectaremos los repositorios a mano y simularemos el payload que Redis le enviaría:

```typescript
it('debería cancelar la orden y devolver el stock si sigue PENDING tras 15 minutos', async () => {
  // 1. Instanciamos la clase del Processor manualmente
  const processor = new ReserveProcessor(dataSource, orderRepo, tierRepo, ticketRepo);
  
  // 2. Simulamos la estructura cruda que BullMQ inyecta
  const mockJob = { 
    name: 'expire-order',
    data: { orderId: 'uuid-orden-creada-previamente-en-estado-pending' } 
  } as Job;
  
  // 3. Ejecutamos el Processor a voluntad
  await processor.process(mockJob);
  
  // 4. Evaluamos el impacto real en la base de datos de test
  const order = await orderRepo.findById(mockJob.data.orderId);
  expect(order.status).toBe(OrderStatus.FAILED); // La orden fue destruida
  
  // Validamos que el stock fue reintegrado al Tier
  const tier = await tierRepo.findById('tier-id');
  expect(tier.availableStock).toBe(inventarioOriginal + cantidadComprada);
});
```

---

## 5. Implementación y Ejecución de la Suite

La estructura del código debe reflejar esta seriedad:

1. **`test/integration/order.service.spec.ts`**: Aquí van los tests de concurrencia y acceso a base de datos.
2. **`test/integration/reserve.processor.spec.ts`**: Aquí van las pruebas manuales del worker devolviendo el inventario.
3. **`test/e2e/tickets.e2e-spec.ts`**: Aquí usamos `supertest` para hacer un Request HTTP enviando una firma inválida para garantizar que responda `400 Bad Request` en menos de 100ms.

### ¿Cómo correr las pruebas?

```bash
# 1. Levantar el Postgres exclusivo de Testing (definido en docker-compose.test.yml)
docker-compose -f docker-compose.test.yml up -d db_test

# 2. Correr la suite de Integración/E2E inyectando la variable de entorno real
DATABASE_URL=postgres://user:pass@localhost:5432/ticketrush_test npm run test:e2e
```
