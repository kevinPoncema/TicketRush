import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketTierRepository } from '../Repositories/ticket-tier.repository';
import { EventRepository } from '../Repositories/event.repository';
import { TicketTier } from '../models/ticket-tier.entity';
import { UserRole } from '../models/user.entity';

@Injectable()
export class TicketTierService {
  constructor(
    private readonly tierRepository: TicketTierRepository,
    private readonly eventRepository: EventRepository
  ) { }

  async getTiersByEvent(eventId: string) {
    return this.tierRepository.findByEventId(eventId);
  }

  private async validateAdminAccess(eventId: string, user: any) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can manage ticket tiers');
    }
    const event = await this.eventRepository.findByIdAndTenant(eventId, user.tenantId);
    if (!event) {
      throw new NotFoundException('Event not found or does not belong to your tenant');
    }
  }

  async createTier(user: any, data: Partial<TicketTier>) {
    if (!data.eventId) {
      throw new BadRequestException('eventId is required');
    }
    await this.validateAdminAccess(data.eventId, user);
    return this.tierRepository.create(data);
  }

  async updateTier(user: any, id: string, data: Partial<TicketTier>) {
    const tier = await this.tierRepository.findById(id);
    await this.validateAdminAccess(tier.eventId, user);

    delete data.eventId;

    return this.tierRepository.update(id, data);
  }

  async deleteTier(user: any, id: string) {
    const tier = await this.tierRepository.findById(id);
    await this.validateAdminAccess(tier.eventId, user);
    return this.tierRepository.delete(id);
  }
}
