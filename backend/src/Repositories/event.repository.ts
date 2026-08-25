import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../models/event.entity';

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) { }

  async create(data: Partial<Event>): Promise<Event> {
    const event = this.repository.create(data);
    return this.repository.save(event);
  }

  async findAllByTenant(tenantId: string): Promise<Event[]> {
    return this.repository.find({
      where: { tenantId },
      relations: { ticketTiers: true }
    });
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<Event> {
    const event = await this.repository.findOne({ where: { id, tenantId } });
    if (!event) throw new NotFoundException('Event not found or access denied');
    return event;
  }

  async findByIdPublic(id: string): Promise<Event> {
    const event = await this.repository.findOne({
      where: { id },
      relations: { ticketTiers: true }
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, tenantId: string, data: Partial<Event>): Promise<Event> {
    await this.findByIdAndTenant(id, tenantId); // ensure it exists and belongs to tenant
    await this.repository.update(id, data);
    return this.findByIdAndTenant(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await this.repository.delete({ id, tenantId });
    if (result.affected === 0) throw new NotFoundException('Event not found or access denied');
  }
}
