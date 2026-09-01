import { 
  UserAlreadyExistsException, 
  SelfDeletionNotAllowedException, 
  InvalidCredentialsException,
  TicketNotFoundException,
  UnauthorizedTenantAccessException,
  InvalidCryptographicSignatureException,
  TicketAlreadyUsedException,
  InvalidTicketStatusException,
  CloudStorageException,
  EventNotFoundException,
  OrderAlreadyProcessedException,
  MissingParameterException,
  TicketSoldOutException,
  OrderNotFoundException
} from '../exceptions';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketTierRepository } from '../Repositories/ticket-tier.repository';
import { EventRepository } from '../Repositories/event.repository';
import { TicketTier } from '../models/ticket-tier.entity';

@Injectable()
export class TicketTierService {
  constructor(
    private readonly tierRepository: TicketTierRepository,
    private readonly eventRepository: EventRepository
  ) {}

  async getTiersByEvent(eventId: string) {
    return this.tierRepository.findByEventId(eventId);
  }

  private async validateTenantOwnership(eventId: string, user: any) {
    const event = await this.eventRepository.findByIdAndTenant(eventId, user.tenantId);
    if (!event) {
      throw new EventNotFoundException();
    }
  }

  async createTier(user: any, data: Partial<TicketTier>) {
    if (!data.eventId) {
        throw new MissingParameterException('eventId');
    }
    await this.validateTenantOwnership(data.eventId, user);
    return this.tierRepository.create(data);
  }

  async updateTier(user: any, id: string, data: Partial<TicketTier>) {
    const tier = await this.tierRepository.findById(id);
    await this.validateTenantOwnership(tier.eventId, user);
    delete data.eventId;
    return this.tierRepository.update(id, data);
  }

  async deleteTier(user: any, id: string) {
    const tier = await this.tierRepository.findById(id);
    await this.validateTenantOwnership(tier.eventId, user);
    return this.tierRepository.delete(id);
  }
}
