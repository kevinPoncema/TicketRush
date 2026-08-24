import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../models/order.entity';
import { TicketTier } from '../models/ticket-tier.entity';

@Processor('reserve-queue')
export class ReserveProcessor extends WorkerHost {
  private readonly logger = new Logger(ReserveProcessor.name);

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(TicketTier) private ticketTierRepository: Repository<TicketTier>,
    private dataSource: DataSource
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name} with data:`, job.data);
    
    if (job.name === 'check-payment-status') {
      const { orderId, ticketTierId } = job.data;
      
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const order = await queryRunner.manager.findOne(Order, { where: { id: orderId } });
        
        if (!order) {
          this.logger.error(`Order ${orderId} not found`);
          await queryRunner.rollbackTransaction();
          return;
        }

        if (order.status === OrderStatus.PENDING) {
          this.logger.log(`Order ${orderId} is still pending. Canceling order and returning stock...`);
          
          order.status = OrderStatus.FAILED;
          await queryRunner.manager.save(order);

          if (ticketTierId) {
             const ticketTier = await queryRunner.manager.findOne(TicketTier, {
               where: { id: ticketTierId },
               lock: { mode: 'pessimistic_write' },
             });
             if (ticketTier) {
               ticketTier.availableStock += 1;
               await queryRunner.manager.save(ticketTier);
             }
          }
          
          await queryRunner.commitTransaction();
          this.logger.log(`Order ${orderId} marked as FAILED and stock returned.`);
        } else {
          await queryRunner.commitTransaction();
          this.logger.log(`Order ${orderId} is already PAID. Nothing to do.`);
        }
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }
}
