import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReserveProcessor } from './reserve.processor';
import { OrderRepository } from '../Repositories/order.repository';
import { TicketTierRepository } from '../Repositories/ticket-tier.repository';
import { TicketRepository } from '../Repositories/ticket.repository';
import { Order } from '../models/order.entity';
import { TicketTier } from '../models/ticket-tier.entity';
import { Ticket } from '../models/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, TicketTier, Ticket]),
    BullModule.registerQueue({
      name: 'reserve-queue',
    }),
  ],
  providers: [ReserveProcessor, OrderRepository, TicketTierRepository, TicketRepository],
  exports: [BullModule]
})
export class JobsModule {}
