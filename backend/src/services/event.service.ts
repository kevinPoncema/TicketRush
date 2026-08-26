import { Injectable } from '@nestjs/common';
import { EventRepository } from '../Repositories/event.repository';
import { Event } from '../models/event.entity';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(tenantId: string, data: Partial<Event>): Promise<Event> {
    return this.eventRepository.create({ ...data, tenantId });
  }

  async getEventsByTenant(tenantId: string): Promise<Event[]> {
    return this.eventRepository.findAllByTenant(tenantId);
  }

  async getPublicEvents(tenantId: string, page?: number, limit?: number, status?: 'upcoming' | 'past') {
    return this.eventRepository.findPublicEvents(tenantId, page, limit, status);
  }

  async getEvent(id: string, tenantId: string): Promise<Event> {
    return this.eventRepository.findByIdAndTenant(id, tenantId);
  }

  async getUpcomingByTenantPublic(tenantId: string): Promise<Event[]> {
    return this.eventRepository.findUpcomingByTenantPublic(tenantId);
  }

  async getEventPublic(id: string): Promise<Event> {
    return this.eventRepository.findByIdPublic(id);
  }

  async updateEvent(id: string, tenantId: string, data: Partial<Event>): Promise<Event> {
    return this.eventRepository.update(id, tenantId, data);
  }

  async deleteEvent(id: string, tenantId: string): Promise<void> {
    return this.eventRepository.delete(id, tenantId);
  }
}
