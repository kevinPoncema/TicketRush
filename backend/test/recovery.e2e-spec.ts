import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';

jest.mock('bullmq', () => ({
  Queue: class { constructor() {} add() { return Promise.resolve(); } on() {} close() {} disconnect() {} },
  Worker: class { constructor() {} on() {} close() {} disconnect() {} },
}));

import { AppModule } from '../src/app.module';
import { ReserveProcessor } from '../src/jobs/reserve.processor';
import { WebhookProcessor } from '../src/jobs/webhook.processor';
import { TenantRepository } from '../src/Repositories/tenant.repository';
import { EventRepository } from '../src/Repositories/event.repository';
import { TicketTierRepository } from '../src/Repositories/ticket-tier.repository';
import { OrderRepository } from '../src/Repositories/order.repository';
import { ClientRepository } from '../src/Repositories/client.repository';
import { Order, OrderStatus } from '../src/models/order.entity';
import { OrderService } from '../src/services/order.service';

describe('Order Recovery & PDF (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let orderRepo: OrderRepository;
  
  let validOrder: Order;
  let clientEmail: string;
  let accessPin = 'X7B9K2';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken('reserve-queue')).useValue({ add: jest.fn() })
      .overrideProvider(getQueueToken('webhook-queue')).useValue({ add: jest.fn() })
      .overrideProvider(ReserveProcessor).useValue({})
      .overrideProvider(WebhookProcessor).useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    dataSource = app.get<DataSource>(DataSource);
    orderRepo = app.get(OrderRepository);
    const tenantRepo = app.get(TenantRepository);
    const eventRepo = app.get(EventRepository);
    const tierRepo = app.get(TicketTierRepository);
    const clientRepo = app.get(ClientRepository);

    // Setup Test Data
    const tenant = await tenantRepo.create({ name: 'Recovery Tenant' });
    const event = await eventRepo.create({ tenantId: tenant.id, name: 'Recovery Event', date: new Date(), location: 'Test' });
    await tierRepo.create({ eventId: event.id, name: 'General', price: 10, capacity: 10, availableStock: 10 });
    
    clientEmail = `recovery-${Date.now()}@test.com`;
    const client = await clientRepo.findOrCreate(clientEmail, 'Recovery Test', dataSource.createEntityManager());
    
    // Inyectamos una orden pagada con su PIN
    // Simulamos directamente insertando con TypeORM raw si no queremos usar el Repo privado
    const result = await dataSource.query(
      `INSERT INTO "orders" (client_id, total_amount, status, idempotency_key, access_pin) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [client.id, 10, OrderStatus.PAID, `rec-key-${Date.now()}`, accessPin]
    );
    validOrder = result[0];
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('REC-01: Rechaza recuperación con PIN incorrecto (404)', () => {
    return request(app.getHttpServer())
      .post('/orders/recover')
      .send({ email: clientEmail, accessPin: 'INCORRECT' })
      .expect(404);
  });

  it('REC-02: Recupera exitosamente con el PIN correcto (200)', () => {
    return request(app.getHttpServer())
      .post('/orders/recover')
      .send({ email: clientEmail, accessPin })
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(validOrder.id);
        expect(res.body.accessPin).toBeUndefined();
      });
  });

  it('REC-03: Descarga del PDF al vuelo devuelve un documento válido (200)', () => {
    return request(app.getHttpServer())
      .get(`/orders/${validOrder.id}/pdf`)
      .query({ email: clientEmail, accessPin })
      .expect(200)
      .expect('Content-Type', 'application/pdf');
  });

  it('REC-04: Bloquea ataques de fuerza bruta al PIN (Rate Limiting 429)', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/orders/recover')
        .send({ email: clientEmail, accessPin: 'ATTACK' })
        .expect(404);
    }
    return request(app.getHttpServer())
      .post('/orders/recover')
      .send({ email: clientEmail, accessPin: 'ATTACK' })
      .expect(429);
  });
});
