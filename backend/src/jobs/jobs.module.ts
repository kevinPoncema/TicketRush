import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReserveProcessor } from './reserve.processor';
import { Order } from '../models/order.entity';
import { TicketTier } from '../models/ticket-tier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, TicketTier]),
    BullModule.registerQueue({
      name: 'reserve-queue',
    }),
  ],
  providers: [ReserveProcessor],
  exports: [BullModule]
})
export class JobsModule {}
