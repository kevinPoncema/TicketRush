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
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { TicketRepository } from '../Repositories/ticket.repository';
import { TicketStatus } from '../models/ticket.entity';

@Injectable()
export class TicketService {
  constructor(private readonly ticketRepository: TicketRepository) { }

  private generateTicketSignature(ticketId: string, orderId: string): string {
    const secret = process.env.HMAC_SECRET || 'super-secret-ticketrush-key';
    const payload = `${ticketId}:${orderId}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  async validateTicket(ticketId: string, signature: string, staffUser: any) {
    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      throw new TicketNotFoundException();
    }

    if (ticket.ticketTier.event.tenantId !== staffUser.tenantId) {
      throw new UnauthorizedTenantAccessException();
    }
    const expectedSignature = this.generateTicketSignature(ticket.id, ticket.orderId);

    if (signature.length !== expectedSignature.length) {
      throw new InvalidCryptographicSignatureException('Firma criptográfica inválida (Longitud incorrecta)');
    }

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      throw new InvalidCryptographicSignatureException('Firma criptográfica inválida (Posible fraude)');
    }

    if (ticket.status === TicketStatus.USED) {
      throw new TicketAlreadyUsedException();
    }

    if (ticket.status !== TicketStatus.VALID) {
      throw new InvalidTicketStatusException(ticket.status);
    }

    ticket.status = TicketStatus.USED;
    await this.ticketRepository.save(ticket);

    return {
      success: true,
      message: 'Ticket validado correctamente. ¡Acceso Permitido!',
      ticketId: ticket.id,
      tier: ticket.ticketTier.name
    };
  }
}
