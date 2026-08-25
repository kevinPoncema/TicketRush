import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

import { OrderService } from '../src/services/order.service';
import { TenantRepository } from '../src/Repositories/tenant.repository';
import { EventRepository } from '../src/Repositories/event.repository';
import { TicketTierRepository } from '../src/Repositories/ticket-tier.repository';

describe('OrderService - Concurrency & Race Conditions (e2e)', () => {
  let app: INestApplication;
  let orderService: OrderService;
  let tierRepo: TicketTierRepository;
  let dataSource: DataSource;
  let testTierId: string;

  beforeAll(async () => {
    // 1. Configuramos el módulo interceptando BullMQ para no depender de Redis
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken('reserve-queue'))
      .useValue({ add: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    orderService = app.get<OrderService>(OrderService);
    tierRepo = app.get<TicketTierRepository>(TicketTierRepository);
    dataSource = app.get<DataSource>(DataSource);
    const tenantRepo = app.get<TenantRepository>(TenantRepository);
    const eventRepo = app.get<EventRepository>(EventRepository);

    // 2. Limpiar base de datos (SÓLO DE TEST) para tener un entorno predecible

    // 3. Preparar los datos de prueba
    const tenant = await tenantRepo.create({ name: 'Test Tenant' });
    const event = await eventRepo.create({ tenantId: tenant.id, name: 'Concierto Test', date: new Date(), location: 'Test' });
    const tier = await tierRepo.create({ eventId: event.id, name: 'VIP', price: 100, capacity: 10, availableStock: 1 });
    
    testTierId = tier.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería evitar la sobreventa cuando 5 usuarios compran el último boleto a la vez', async () => {
    // Verificamos el setup: Solo hay 1 entrada
    const initialTier = await tierRepo.findById(testTierId);
    expect(initialTier.availableStock).toBe(1);

    // Disparamos 5 peticiones concurrentes simultáneas
    const attempts = Array.from({ length: 5 }).map((_, i) =>
      orderService.createOrder(
        {
          clientEmail: `user${i}@test.com`,
          clientName: `User ${i}`,
          tiers: [{ ticketTierId: testTierId, quantity: 1 }],
        },
        `idempotency-test-${i}`
      ).catch((e) => e)
    );

    // Esperamos a que la base de datos procese el "embudo" de transacciones
    const results = await Promise.all(attempts);

    // Filtramos los éxitos (tienen id) y los fallos (arrojan error de Sold Out)
    const successOrders = results.filter((r) => !(r instanceof Error) && r.id);
    const failedOrders = results.filter((r) => r instanceof Error);

    // Aserciones de Arquitecto
    expect(successOrders).toHaveLength(1); // Exactamente 1 transacción triunfa
    expect(failedOrders).toHaveLength(4);  // Las otras 4 fallan y se revierten

    // Asegurarse de que el stock es 0 matemáticamente, ni negativo ni flotante.
    const finalTier = await tierRepo.findById(testTierId);
    expect(finalTier.availableStock).toBe(0);
  });
});
