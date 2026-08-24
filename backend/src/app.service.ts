import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './models/order.entity';
import { TicketTier } from './models/ticket-tier.entity';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(TicketTier) private ticketTierRepository: Repository<TicketTier>,
    private dataSource: DataSource,
    @InjectQueue('reserve-queue') private reserveQueue: Queue,
  ) {}

  getHello(): string {
    return 'TicketRush B2B Engine (TypeORM version)';
  }

  async createSoftReserve(clientId: string, ticketTierId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Pessimistic lock
      const ticketTier = await queryRunner.manager.findOne(TicketTier, {
        where: { id: ticketTierId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ticketTier || ticketTier.availableStock <= 0) {
        throw new Error('Tickets sold out');
      }

      ticketTier.availableStock -= 1;
      await queryRunner.manager.save(ticketTier);

      // 2. Create Order
      const order = new Order();
      order.clientId = clientId;
      order.totalAmount = ticketTier.price;
      order.status = OrderStatus.PENDING;
      order.idempotencyKey = Math.random().toString(36).substring(7);
      order.expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
      
      const savedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // 3. Dispatch delayed job
      await this.reserveQueue.add(
        'check-payment-status',
        { orderId: savedOrder.id, ticketTierId },
        { delay: 10 * 60000 }
      );

      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
