import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
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

import { TenantService } from './services/tenant.service';
import { EventService } from './services/event.service';
import { AuthService } from './services/auth.service';

import { TenantController } from './controllers/tenant.controller';
import { EventController } from './controllers/event.controller';
import { AuthController } from './controllers/auth.controller';

import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Tenant, User, TenantConfig, Event, TicketTier, Client, Order, Ticket],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Order, Ticket, TicketTier, Client, Tenant, Event, User]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'reserve-queue',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-ticketrush-key',
      signOptions: { expiresIn: '1d' },
    }),
    JobsModule,
  ],
  controllers: [AppController, AuthController, TenantController, EventController],
  providers: [
    AppService,
    TenantRepository,
    EventRepository,
    UserRepository,
    TenantService,
    EventService,
    AuthService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register-tenant', method: RequestMethod.POST }
      )
      .forRoutes('*');
  }
}
