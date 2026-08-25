import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

import { OrderRepository } from '../Repositories/order.repository';
import { TicketTierRepository } from '../Repositories/ticket-tier.repository';
import { ClientRepository } from '../Repositories/client.repository';
import { TicketRepository } from '../Repositories/ticket.repository';

import { OrderStatus } from '../models/order.entity';
import { TicketStatus, Ticket } from '../models/ticket.entity';
import { CreateOrderDto, OrderTierItemDto } from '../dtos/order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderRepository: OrderRepository,
    private readonly ticketTierRepository: TicketTierRepository,
    private readonly clientRepository: ClientRepository,
    private readonly ticketRepository: TicketRepository,
    @InjectQueue('reserve-queue') private readonly redisQueue: Queue,
  ) { }

  async createOrder(data: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = await this.resolveClient(data.clientEmail, data.clientName, queryRunner.manager);

      const { totalAmount, ticketsToCreate } = await this.processTiersSequentially(data.tiers, queryRunner.manager);

      const order = await this.saveOrderAndTickets(client.id, totalAmount, ticketsToCreate, queryRunner.manager);

      await queryRunner.commitTransaction();

      await this.scheduleOrderExpiration(order.id);

      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async resolveClient(email: string, name: string, manager: EntityManager) {
    return this.clientRepository.findOrCreate(email, name, manager);
  }

  private async processTiersSequentially(tiers: OrderTierItemDto[], manager: EntityManager) {
    const tierPromises = tiers.map(item => this.processSingleTier(item, manager));
    const results = await Promise.all(tierPromises);

    let totalAmount = 0;
    const ticketsToCreate: Partial<Ticket>[] = [];

    for (const result of results) {
      totalAmount += result.amount;
      ticketsToCreate.push(...result.tickets);
    }

    return { totalAmount, ticketsToCreate };
  }

  private async processSingleTier(item: OrderTierItemDto, manager: EntityManager) {
    const tier = await this.ticketTierRepository.findByIdAndLock(item.ticketTierId, manager);

    if (tier.availableStock < item.quantity) {
      throw new BadRequestException(`Sold out: No hay suficiente stock para el tier ${tier.name}`);
    }

    tier.availableStock -= item.quantity;
    await this.ticketTierRepository.save(tier, manager);

    const amount = Number(tier.price) * item.quantity;
    const tickets: Partial<Ticket>[] = [];

    for (let i = 0; i < item.quantity; i++) {
      tickets.push({
        ticketTierId: tier.id,
        status: TicketStatus.RESERVED,
      });
    }

    return { amount, tickets };
  }

  private async saveOrderAndTickets(clientId: string, totalAmount: number, ticketsToCreate: Partial<Ticket>[], manager: EntityManager) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const order = await this.orderRepository.create({
      clientId,
      totalAmount,
      status: OrderStatus.PENDING,
      idempotencyKey: randomUUID(),
      expiresAt,
    }, manager);

    const ticketsWithOrder = ticketsToCreate.map(t => ({ ...t, orderId: order.id }));
    await this.ticketRepository.createTickets(ticketsWithOrder, manager);

    return order;
  }

  private async scheduleOrderExpiration(orderId: string) {
    const delayInMinutes = 15 * 60 * 1000;
    await this.redisQueue.add(
      'expire-order',
      { orderId },
      { delay: delayInMinutes }
    );
  }

  async processPayment(orderId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.orderRepository.findByIdAndLock(orderId, queryRunner.manager);

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(`Cannot process payment: Order is already ${order.status}`);
      }

      const isSuccess = Math.random() < 0.85;

      if (isSuccess) {
        order.status = OrderStatus.PAID;
        await queryRunner.manager.save(order);
        await this.ticketRepository.updateStatusByOrder(order.id, TicketStatus.VALID, queryRunner.manager);

        await queryRunner.commitTransaction();
        return { success: true, orderStatus: OrderStatus.PAID };
      } else {
        order.status = OrderStatus.FAILED;
        await queryRunner.manager.save(order);
        await this.ticketRepository.updateStatusByOrder(order.id, TicketStatus.EXPIRED, queryRunner.manager);

        for (const ticket of order.tickets) {
          const tier = await this.ticketTierRepository.findByIdAndLock(ticket.ticketTierId, queryRunner.manager);
          tier.availableStock += 1;
          await this.ticketTierRepository.save(tier, queryRunner.manager);
        }

        await queryRunner.commitTransaction();
        return { success: false, orderStatus: OrderStatus.FAILED, message: 'Payment rejected by gateway' };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrder(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lockedOrder = await this.orderRepository.findByIdAndLock(id, queryRunner.manager);

      if (lockedOrder.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order is already finalized');
      }

      lockedOrder.status = OrderStatus.FAILED;
      await queryRunner.manager.save(lockedOrder);
      await this.ticketRepository.updateStatusByOrder(lockedOrder.id, TicketStatus.EXPIRED, queryRunner.manager);

      for (const ticket of lockedOrder.tickets) {
        const tier = await this.ticketTierRepository.findByIdAndLock(ticket.ticketTierId, queryRunner.manager);
        tier.availableStock += 1;
        await this.ticketTierRepository.save(tier, queryRunner.manager);
      }

      await queryRunner.commitTransaction();
      return lockedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
