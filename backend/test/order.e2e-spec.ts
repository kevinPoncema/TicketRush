import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

// ¡Mockeamos toda la librería BullMQ antes de importar los módulos!
// Esto evita CUALQUIER intento de conexión a Redis (Worker o Queue)
jest.mock('bullmq', () => ({
  Queue: class QueueMock {
    constructor() {}
    add() { return Promise.resolve(); }
    on() {}
    close() { return Promise.resolve(); }
    disconnect() { return Promise.resolve(); }
  },
  Worker: class WorkerMock {
    constructor() {}
    on() {}
    close() { return Promise.resolve(); }
    disconnect() { return Promise.resolve(); }
  },
}));

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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    orderService = app.get<OrderService>(OrderService);
    tierRepo = app.get<TicketTierRepository>(TicketTierRepository);
    dataSource = app.get<DataSource>(DataSource);
    const tenantRepo = app.get<TenantRepository>(TenantRepository);
    const eventRepo = app.get<EventRepository>(EventRepository);

    // Setup de datos
    const tenant = await tenantRepo.create({ name: 'Test Tenant' });
    const event = await eventRepo.create({ tenantId: tenant.id, name: 'Concierto Test', date: new Date(), location: 'Test' });
    const tier = await tierRepo.create({ eventId: event.id, name: 'VIP', price: 100, capacity: 10, availableStock: 1 });
    
    testTierId = tier.id;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('debería evitar la sobreventa cuando 5 usuarios compran el último boleto a la vez', async () => {
    const initialTier = await tierRepo.findById(testTierId);
    expect(initialTier.availableStock).toBe(1);

    const attempts = Array.from({ length: 5 }).map((_, i) =>
      orderService.createOrder(
        {
          clientEmail: `user${i}@test.com`,
          clientName: `User ${i}`,
          tiers: [{ ticketTierId: testTierId, quantity: 1 }],
        },
        `idempotency-test-${Date.now()}-${i}`
      ).catch((e) => e)
    );

    const results = await Promise.all(attempts);

    const successOrders = results.filter((r) => !(r instanceof Error) && r.id);
    const failedOrders = results.filter((r) => r instanceof Error);

    expect(successOrders).toHaveLength(1);
    expect(failedOrders).toHaveLength(4);

    const finalTier = await tierRepo.findById(testTierId);
    expect(finalTier.availableStock).toBe(0);
  });
});
