import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketTier } from '../models/ticket-tier.entity';

@Injectable()
export class TicketTierRepository {
  constructor(
    @InjectRepository(TicketTier)
    private readonly repository: Repository<TicketTier>,
  ) {}

  async create(data: Partial<TicketTier>): Promise<TicketTier> {
    const tier = this.repository.create(data);
    return this.repository.save(tier);
  }

  async findById(id: string): Promise<TicketTier> {
    const tier = await this.repository.findOne({ where: { id }, relations: { event: true } });
    if (!tier) throw new NotFoundException('Ticket Tier not found');
    return tier;
  }
  
  async findByEventId(eventId: string): Promise<TicketTier[]> {
    return this.repository.find({ where: { eventId } });
  }

  async update(id: string, data: Partial<TicketTier>): Promise<TicketTier> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Ticket Tier not found');
  }
}
