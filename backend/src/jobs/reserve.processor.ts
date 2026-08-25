import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { OrderRepository } from '../Repositories/order.repository';
import { TicketTierRepository } from '../Repositories/ticket-tier.repository';
import { TicketRepository } from '../Repositories/ticket.repository';

import { OrderStatus } from '../models/order.entity';
import { TicketStatus } from '../models/ticket.entity';

@Processor('reserve-queue')
export class ReserveProcessor extends WorkerHost {
  private readonly logger = new Logger(ReserveProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly ticketTierRepository: TicketTierRepository,
    private readonly ticketRepository: TicketRepository,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    
    if (job.name === 'expire-order') {
      const { orderId } = job.data;
      
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Bloquear la orden para evitar que se pague mientras la cancelamos
        const order = await this.orderRepository.findByIdAndLock(orderId, queryRunner.manager);
        
        if (order.status !== OrderStatus.PENDING) {
          this.logger.log(`Order ${orderId} is already ${order.status}. No action needed.`);
          await queryRunner.commitTransaction();
          return;
        }

        this.logger.log(`Order ${orderId} expired (15 mins passed). Canceling and returning stock...`);
        
        // 1. Marcar orden como FAILED
        await this.orderRepository.updateStatus(order.id, OrderStatus.FAILED, queryRunner.manager);

        // 2. Marcar tickets como EXPIRED
        await this.ticketRepository.updateStatusByOrder(order.id, TicketStatus.EXPIRED, queryRunner.manager);

        // 3. Agrupar la cantidad de tickets por Tier para hacer menos consultas
        const tierCounts: Record<string, number> = {};
        for (const ticket of order.tickets) {
          tierCounts[ticket.ticketTierId] = (tierCounts[ticket.ticketTierId] || 0) + 1;
        }

        // 4. Ordenar los IDs para evitar deadlocks
        const sortedTierIds = Object.keys(tierCounts).sort();

        // 5. Devolver el stock con bloqueos pesimistas
        for (const tierId of sortedTierIds) {
          const tier = await this.ticketTierRepository.findByIdAndLock(tierId, queryRunner.manager);
          tier.availableStock += tierCounts[tierId];
          await this.ticketTierRepository.save(tier, queryRunner.manager);
        }
        
        await queryRunner.commitTransaction();
        this.logger.log(`Order ${orderId} successfully expired and stock returned.`);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Error expiring order ${job.data.orderId}`, err);
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
  }
}
