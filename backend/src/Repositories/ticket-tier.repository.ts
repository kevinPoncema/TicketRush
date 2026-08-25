import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TicketTier } from '../models/ticket-tier.entity';

@Injectable()
export class TicketTierRepository {
  constructor(
    @InjectRepository(TicketTier)
    private readonly repository: Repository<TicketTier>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(TicketTier) : this.repository;
  }

  async create(data: Partial<TicketTier>, manager?: EntityManager): Promise<TicketTier> {
    const repo = this.getRepo(manager);
    const tier = repo.create(data);
    return repo.save(tier);
  }

  async findById(id: string, manager?: EntityManager): Promise<TicketTier> {
    const repo = this.getRepo(manager);
    const tier = await repo.findOne({ where: { id }, relations: { event: true } });
    if (!tier) throw new NotFoundException(`Ticket Tier ${id} not found`);
    return tier;
  }

  async findByIdAndLock(id: string, manager: EntityManager): Promise<TicketTier> {
    const repo = this.getRepo(manager);
    const tier = await repo.findOne({ 
      where: { id }, 
      lock: { mode: 'pessimistic_write' } 
    });
    if (!tier) throw new NotFoundException(`Ticket Tier ${id} not found`);
    return tier;
  }
  
  async findByEventId(eventId: string, manager?: EntityManager): Promise<TicketTier[]> {
    return this.getRepo(manager).find({ where: { eventId } });
  }

  async update(id: string, data: Partial<TicketTier>, manager?: EntityManager): Promise<TicketTier> {
    const repo = this.getRepo(manager);
    await repo.update(id, data);
    return this.findById(id, manager);
  }

  async save(tier: TicketTier, manager?: EntityManager): Promise<TicketTier> {
    return this.getRepo(manager).save(tier);
  }

  async delete(id: string, manager?: EntityManager): Promise<void> {
    const result = await this.getRepo(manager).delete(id);
    if (result.affected === 0) throw new NotFoundException('Ticket Tier not found');
  }
}
