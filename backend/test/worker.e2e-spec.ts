import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Job } from 'bullmq';
import { AppModule } from '../src/app.module';

jest.mock('bullmq', () => ({
  Queue: class { constructor() {} add() { return Promise.resolve(); } on() {} close() {} disconnect() {} },
  Worker: class { constructor() {} on() {} close() {} disconnect() {} },
}));

import { ReserveProcessor } from '../src/jobs/reserve.processor';
import { TenantRepository } from '../src/Repositories/tenant.repository';
import { EventRepository } from '../src/Repositories/event.repository';
import { TicketTierRepository } from '../src/Repositories/ticket-tier.repository';
import { OrderRepository } from '../src/Repositories/order.repository';
import { TicketRepository } from '../src/Repositories/ticket.repository';
import { ClientRepository } from '../src/Repositories/client.repository';
import { OrderStatus } from '../src/models/order.entity';
import { TicketStatus } from '../src/models/ticket.entity';

describe('ReserveProcessor (e2e)', () => {
  let dataSource: DataSource;
  let reserveProcessor: ReserveProcessor;
  let tierRepo: TicketTierRepository;
  let orderRepo: OrderRepository;
  
  let testTierId: string;
  let pendingOrderId: string;
  let paidOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    
    dataSource = app.get<DataSource>(DataSource);
    reserveProcessor = app.get(ReserveProcessor);
    tierRepo = app.get(TicketTierRepository);
    orderRepo = app.get(OrderRepository);
    const tenantRepo = app.get(TenantRepository);
    const eventRepo = app.get(EventRepository);
    const ticketRepo = app.get(TicketRepository);
    const clientRepo = app.get(ClientRepository);

    // Setup Test Data
    const tenant = await tenantRepo.create({ name: 'Worker Tenant' });
    const event = await eventRepo.create({ tenantId: tenant.id, name: 'Worker Event', date: new Date(), location: 'Local' });
    const tier = await tierRepo.create({ eventId: event.id, name: 'General', price: 50, capacity: 10, availableStock: 5 });
    testTierId = tier.id;

    const client = await clientRepo.findOrCreate(`worker-${Date.now()}@test.com`, 'Worker', dataSource.createEntityManager());
    
    const pendingOrder = await orderRepo.create({ clientId: client.id, totalAmount: 50, status: OrderStatus.PENDING, idempotencyKey: `pending-${Date.now()}` });
    await ticketRepo.createTickets([{ orderId: pendingOrder.id, ticketTierId: tier.id, status: TicketStatus.RESERVED }]);
    pendingOrderId = pendingOrder.id;

    const paidOrder = await orderRepo.create({ clientId: client.id, totalAmount: 50, status: OrderStatus.PAID, idempotencyKey: `paid-${Date.now()}` });
    await ticketRepo.createTickets([{ orderId: paidOrder.id, ticketTierId: tier.id, status: TicketStatus.VALID }]);
    paidOrderId = paidOrder.id;
  });

  afterAll(async () => {
    if (dataSource) await dataSource.destroy();
  });

  it('WRK-02: Ignora la orden si ya está PAID', async () => {
    const mockJob = { data: { orderId: paidOrderId } } as unknown as Job;
    await reserveProcessor.process(mockJob);
    
    const order = await orderRepo.findById(paidOrderId);
    expect(order.status).toBe(OrderStatus.PAID);
  });

  it('WRK-01: Cancela orden PENDING y reintegra stock', async () => {
    const mockJob = { data: { orderId: pendingOrderId } } as unknown as Job;
    await reserveProcessor.process(mockJob);
    
    const order = await orderRepo.findById(pendingOrderId);
    expect(order.status).toBe(OrderStatus.FAILED);

    // El stock inicial era 5. Se compró 1, debería haberse reintegrado a 6.
    // Wait, el insert inicial fue manual con stock=5, no se restó por OrderService.
    // Así que si reintegra 1, stock será 5 + 1 = 6.
    const tier = await tierRepo.findById(testTierId);
    expect(tier.availableStock).toBe(6);
  });
});
