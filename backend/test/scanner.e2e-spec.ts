import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
// @ts-ignore
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

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
import { TicketRepository } from '../src/Repositories/ticket.repository';
import { ClientRepository } from '../src/Repositories/client.repository';
import { OrderStatus } from '../src/models/order.entity';
import { TicketStatus } from '../src/models/ticket.entity';
import { JwtService } from '@nestjs/jwt';

describe('Scanner Controller (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let validTicketId: string;
  let validSignature: string;
  let adminToken: string;
  let otherAdminToken: string;

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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    
    dataSource = app.get<DataSource>(DataSource);

    // Setup Test Data
    const tenantRepo = app.get(TenantRepository);
    const eventRepo = app.get(EventRepository);
    const tierRepo = app.get(TicketTierRepository);
    const orderRepo = app.get(OrderRepository);
    const ticketRepo = app.get(TicketRepository);
    const clientRepo = app.get(ClientRepository);
    const jwtService = app.get(JwtService);

    // Creamos dos Tenants para probar aislamiento B2B (Tenant cruzado)
    const tenantA = await tenantRepo.create({ name: 'Tenant A' });
    const tenantB = await tenantRepo.create({ name: 'Tenant B' });

    adminToken = jwtService.sign({ sub: 'user-a', email: 'adminA@test.com', tenantId: tenantA.id, role: 'ADMIN' });
    otherAdminToken = jwtService.sign({ sub: 'user-b', email: 'adminB@test.com', tenantId: tenantB.id, role: 'ADMIN' });

    const event = await eventRepo.create({ tenantId: tenantA.id, name: 'Event A', date: new Date(), location: 'Local' });
    const tier = await tierRepo.create({ eventId: event.id, name: 'General', price: 50, capacity: 100, availableStock: 99 });
    
    const client = await clientRepo.findOrCreate(`buyer-${Date.now()}@test.com`, 'Buyer Test', dataSource.createEntityManager());
    const order = await orderRepo.create({ clientId: client.id, totalAmount: 50, status: OrderStatus.PAID, idempotencyKey: `scan-test-${Date.now()}` });
    
    const tickets = await ticketRepo.createTickets([{ orderId: order.id, ticketTierId: tier.id, status: TicketStatus.VALID }]);
    validTicketId = tickets[0].id;
    
    // Generar la firma correcta
    const payload = `${validTicketId}:${order.id}`;
    const secret = process.env.HMAC_SECRET || 'super-secret-ticketrush-key';
    validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('SCAN-04: Firma de longitud incorrecta (Previene Timing Attacks)', () => {
    return request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketId: validTicketId, signature: 'short-signature' })
      .expect(400);
  });

  it('SCAN-03: Falsificación (Firma alterada)', () => {
    const fakeSignature = validSignature.substring(0, validSignature.length - 1) + 'a';
    return request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketId: validTicketId, signature: fakeSignature })
      .expect(400);
  });

  it('SCAN-05: Aislamiento B2B (Staff B escanea Ticket de Evento A)', () => {
    return request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${otherAdminToken}`)
      .send({ ticketId: validTicketId, signature: validSignature })
      .expect(403);
  });

  it('SCAN-01: Escaneo Exitoso (Happy Path)', () => {
    return request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketId: validTicketId, signature: validSignature })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });

  it('SCAN-02: Replay Attack (Ticket ya usado)', () => {
    // Al intentar usar el mismo ticket validado arriba, debe fallar
    return request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketId: validTicketId, signature: validSignature })
      .expect(400);
  });
});
