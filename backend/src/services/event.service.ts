import { Injectable } from '@nestjs/common';
import { EventRepository } from '../Repositories/event.repository';
import { Event } from '../models/event.entity';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) { }

  async createEvent(tenantId: string, data: Partial<Event>): Promise<Event> {
    return this.eventRepository.create({ ...data, tenantId });
  }

  async getEventsByTenant(tenantId: string): Promise<Event[]> {
    const all = await this.eventRepository.findAll();
    return all.filter(e => e.tenantId === tenantId);
  }

  async getEvent(id: string): Promise<Event> {
    return this.eventRepository.findById(id);
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    return this.eventRepository.update(id, data);
  }

  async deleteEvent(id: string): Promise<void> {
    return this.eventRepository.delete(id);
  }
}
