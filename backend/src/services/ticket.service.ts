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
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.ticketTier.event.tenantId !== staffUser.tenantId) {
      throw new ForbiddenException('Este boleto no pertenece a tu organización');
    }
    const expectedSignature = this.generateTicketSignature(ticket.id, ticket.orderId);

    if (signature.length !== expectedSignature.length) {
      throw new BadRequestException('Firma criptográfica inválida (Longitud incorrecta)');
    }

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      throw new BadRequestException('Firma criptográfica inválida (Posible fraude)');
    }

    if (ticket.status === TicketStatus.USED) {
      throw new BadRequestException('El boleto ya fue USADO anteriormente en la puerta');
    }

    if (ticket.status !== TicketStatus.VALID) {
      throw new BadRequestException(`El boleto no es válido para ingreso. Estado actual: ${ticket.status}`);
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
