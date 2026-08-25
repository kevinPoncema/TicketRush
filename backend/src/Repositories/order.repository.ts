import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Order, OrderStatus } from '../models/order.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(Order) : this.repository;
  }

  async findById(id: string, manager?: EntityManager): Promise<Order> {
    const repo = this.getRepo(manager);
    const order = await repo.findOne({ where: { id }, relations: { tickets: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByIdAndLock(id: string, manager: EntityManager): Promise<Order> {
    const repo = this.getRepo(manager);
    const order = await repo.findOne({ 
      where: { id }, 
      relations: { tickets: true },
      lock: { mode: 'pessimistic_write' } 
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByIdempotencyKey(idempotencyKey: string, manager?: EntityManager): Promise<Order | null> {
    const repo = this.getRepo(manager);
    return repo.findOne({ where: { idempotencyKey }, relations: { tickets: true } });
  }

  async create(data: Partial<Order>, manager?: EntityManager): Promise<Order> {
    const repo = this.getRepo(manager);
    const order = repo.create(data);
    return repo.save(order);
  }

  async updateStatus(id: string, status: OrderStatus, manager?: EntityManager): Promise<Order> {
    const repo = this.getRepo(manager);
    await repo.update(id, { status });
    return this.findById(id, manager);
  }
}
