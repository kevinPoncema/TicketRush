import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TenantConfigController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    // Mock bullmq to avoid Redis connection in tests
    jest.mock('bullmq', () => ({
      Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
      })),
      Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        close: jest.fn(),
      })),
    }));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Register an admin
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register-tenant')
      .send({
        tenantName: 'Config Test Tenant ' + Date.now(),
        adminEmail: 'configadmin' + Date.now() + '@test.com',
        password: 'Password123!',
      });
      
    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerRes.body.user.email,
        password: 'Password123!',
      });
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/tenant-config (PUT) - should create config with white-label fields', async () => {
    const res = await request(app.getHttpServer())
      .put('/tenant-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        webhookUrl: 'https://hooks.zapier.com/test',
        customDomain: 'tickets.myfestival.com',
        brandColor: '#FF5500'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.webhookUrl).toBe('https://hooks.zapier.com/test');
    expect(res.body.customDomain).toBe('tickets.myfestival.com');
    expect(res.body.brandColor).toBe('#FF5500');
  });

  it('/tenant-config (GET) - should retrieve the updated config', async () => {
    const res = await request(app.getHttpServer())
      .get('/tenant-config')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.customDomain).toBe('tickets.myfestival.com');
  });
});
