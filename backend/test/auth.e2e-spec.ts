import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ReserveProcessor } from '../src/jobs/reserve.processor';
import { WebhookProcessor } from '../src/jobs/webhook.processor';

// Mockeamos bullmq globalmente para evadir conexiones de Redis
jest.mock('bullmq', () => ({
  Queue: class { constructor() {} add() { return Promise.resolve(); } on() {} close() {} disconnect() {} },
  Worker: class { constructor() {} on() {} close() {} disconnect() {} },
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

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
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  const tenantName = `Tenant-${Date.now()}`;
  const adminEmail = `admin-${Date.now()}@test.com`;
  const password = 'Password123!';

  it('AUTH-01: /auth/register-tenant (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({ tenantName, adminEmail, password })
      .expect(201)
      .expect((res) => {
        expect(res.body.tenant).toBeDefined();
        expect(res.body.admin).toBeDefined();
        expect(res.body.admin.role).toBe('ADMIN');
      });
  });

  it('AUTH-02: /auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        adminToken = res.body.access_token;
      });
  });

  it('AUTH-03: /auth/create-member (POST) sin token', () => {
    return request(app.getHttpServer())
      .post('/auth/create-member')
      .send({ email: `staff-${Date.now()}@test.com`, password, role: 'STAFF' })
      .expect(401);
  });

  it('AUTH-05: /auth/create-member (POST) con token ADMIN', () => {
    return request(app.getHttpServer())
      .post('/auth/create-member')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `staff-${Date.now()}@test.com`, password, role: 'STAFF' })
      .expect(201)
      .expect((res) => {
        expect(res.body.role).toBe('STAFF');
      });
  });
});
