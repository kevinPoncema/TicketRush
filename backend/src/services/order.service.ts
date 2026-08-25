import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { NotFoundException } from '@nestjs/common';

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
    @InjectQueue('webhook-queue') private readonly webhookQueue: Queue,
  ) { }

  async createOrder(data: CreateOrderDto, idempotencyKey: string) {
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder) {
      return {
        message: 'Order already exists for this Idempotency-Key',
        order: existingOrder
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingInTx = await this.orderRepository.findByIdempotencyKey(idempotencyKey, queryRunner.manager);
      if (existingInTx) {
        await queryRunner.rollbackTransaction();
        return { message: 'Order already exists', order: existingInTx };
      }

      const client = await this.resolveClient(data.clientEmail, data.clientName, queryRunner.manager);

      const { totalAmount, ticketsToCreate } = await this.processTiersSequentially(data.tiers, queryRunner.manager);

      const order = await this.saveOrderAndTickets(client.id, totalAmount, ticketsToCreate, idempotencyKey, queryRunner.manager);
      order.accessPin = crypto.randomBytes(3).toString('hex').toUpperCase(); // Ej: A1B2C3
      await queryRunner.manager.save(order);

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
    const sortedTiers = [...tiers].sort((a, b) => a.ticketTierId.localeCompare(b.ticketTierId));

    let totalAmount = 0;
    const ticketsToCreate: Partial<Ticket>[] = [];

    for (const item of sortedTiers) {
      const tier = await this.ticketTierRepository.findByIdAndLock(item.ticketTierId, manager);

      if (tier.availableStock < item.quantity) {
        throw new BadRequestException(`Sold out: No hay suficiente stock para el tier ${tier.name}`);
      }

      tier.availableStock -= item.quantity;
      await this.ticketTierRepository.save(tier, manager);

      const amount = Number(tier.price) * item.quantity;
      for (let i = 0; i < item.quantity; i++) {
        ticketsToCreate.push({
          ticketTierId: tier.id,
          status: TicketStatus.RESERVED,
        });
      }
      totalAmount += amount;
    }

    return { totalAmount, ticketsToCreate };
  }

  private async saveOrderAndTickets(clientId: string, totalAmount: number, ticketsToCreate: Partial<Ticket>[], idempotencyKey: string, manager: EntityManager) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const order = await this.orderRepository.create({
      clientId,
      totalAmount,
      status: OrderStatus.PENDING,
      idempotencyKey,
      expiresAt,
    }, manager);

    const ticketsWithOrder = ticketsToCreate.map(t => ({ ...t, orderId: order.id }));
    const savedTickets = await this.ticketRepository.createTickets(ticketsWithOrder, manager);

    order.tickets = savedTickets;
    return order;
  }

  private async scheduleOrderExpiration(orderId: string) {
    await this.redisQueue.add(
      'expire-order',
      { orderId },
      { delay: 15 * 60 * 1000 }
    );
  }

  private generateTicketSignature(ticketId: string, orderId: string): string {
    const secret = process.env.HMAC_SECRET || 'super-secret-ticketrush-key';
    const payload = `${ticketId}:${orderId}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
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

        for (const ticket of order.tickets) {
          ticket.status = TicketStatus.VALID;
          ticket.signature = this.generateTicketSignature(ticket.id, order.id);
        }
        await this.ticketRepository.saveBulk(order.tickets, queryRunner.manager);

        await queryRunner.commitTransaction();
        
        // Enviar evento asíncrono para notificar por Webhook
        await this.webhookQueue.add('send-webhook', { orderId: order.id });

        return order;
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
  async recoverOrder(email: string, accessPin: string) {
    const order = await this.orderRepository.findRecoverableOrder(email, accessPin);
    if (!order) {
      throw new NotFoundException('Orden no encontrada o PIN incorrecto');
    }
    return order;
  }
}
