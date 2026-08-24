import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../models/event.entity';

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) {}

  async create(data: Partial<Event>): Promise<Event> {
    const event = this.repository.create(data);
    return this.repository.save(event);
  }

  async findAll(): Promise<Event[]> {
    return this.repository.find({ relations: { tenant: true } });
  }

  async findById(id: string): Promise<Event> {
    const event = await this.repository.findOne({ where: { id }, relations: { tenant: true } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    await this.findById(id);
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Event not found');
  }
}
