import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Tenant, User, TenantConfig, Event, TicketTier, Client, Order, Ticket],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Order, Ticket, TicketTier, Client]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'reserve-queue',
    }),
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
