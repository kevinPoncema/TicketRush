import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeService } from './services/stripe.service';
import { JobsModule } from './jobs/jobs.module';

import { Tenant } from './models/tenant.entity';
import { User } from './models/user.entity';
import { TenantConfig } from './models/tenant-config.entity';
import { Event } from './models/event.entity';
import { TicketTier } from './models/ticket-tier.entity';
import { Client } from './models/client.entity';
import { Order } from './models/order.entity';
import { Ticket } from './models/ticket.entity';

import { TenantRepository } from './Repositories/tenant.repository';
import { EventRepository } from './Repositories/event.repository';
import { UserRepository } from './Repositories/user.repository';
import { TenantConfigRepository } from './Repositories/tenant-config.repository';
import { TicketTierRepository } from './Repositories/ticket-tier.repository';
import { OrderRepository } from './Repositories/order.repository';
import { TicketRepository } from './Repositories/ticket.repository';
import { ClientRepository } from './Repositories/client.repository';

import { TenantService } from './services/tenant.service';
import { EventService } from './services/event.service';
import { AuthService } from './services/auth.service';
import { TenantConfigService } from './services/tenant-config.service';
import { TicketTierService } from './services/ticket-tier.service';
import { TicketService } from './services/ticket.service';
import { OrderService } from './services/order.service';
import { PdfService,
    } from './services/pdf.service';

import { TenantController } from './controllers/tenant.controller';
import { EventController } from './controllers/event.controller';
import { AuthController } from './controllers/auth.controller';
import { TenantConfigController } from './controllers/tenant-config.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { TicketTierController } from './controllers/ticket-tier.controller';
import { TicketController } from './controllers/ticket.controller';
import { OrderController } from './controllers/order.controller';

import { AuthMiddleware } from './middlewares/auth.middleware';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Tenant, User, TenantConfig, Event, TicketTier, Client, Order, Ticket],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Order, Ticket, TicketTier, Client, Tenant, Event, User, TenantConfig]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'webhook-queue',
    }),
    BullModule.registerQueue({
      name: 'reserve-queue',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-ticketrush-key',
      signOptions: { expiresIn: '1d' },
    }),
    JobsModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
  ],
  controllers: [
    AppController,
    AuthController,
    TenantController,
    EventController,
    TenantConfigController,
    AnalyticsController,
    TicketTierController,
    TicketController,
    OrderController
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppService,
    TenantRepository,
    EventRepository,
    UserRepository,
    TenantConfigRepository,
    TicketTierRepository,
    OrderRepository,
    TicketRepository,
    ClientRepository,
    TenantService,
    EventService,
    AuthService,
    TenantConfigService,
    AnalyticsService,
    TicketTierService,
    TicketService,
    OrderService,
    PdfService,
    StripeService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register-tenant', method: RequestMethod.POST },
        { path: 'events', method: RequestMethod.GET },
        { path: 'events/:id', method: RequestMethod.GET },
        { path: 'ticket-tiers/event/(.*)', method: RequestMethod.GET },
        { path: 'orders', method: RequestMethod.POST },
        { path: 'orders/recover', method: RequestMethod.POST },
        { path: 'orders/:id/process-payment', method: RequestMethod.POST },
        { path: 'orders/:id/cancel', method: RequestMethod.POST },
        { path: 'orders/:id/pdf', method: RequestMethod.GET },
        { path: 'api/docs/*path', method: RequestMethod.GET }
      )
      .forRoutes('*');
  }
}
