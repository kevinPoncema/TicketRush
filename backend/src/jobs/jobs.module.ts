import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReserveProcessor } from './reserve.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reserve-queue',
    }),
  ],
  providers: [ReserveProcessor],
  exports: [BullModule]
})
export class JobsModule {}
