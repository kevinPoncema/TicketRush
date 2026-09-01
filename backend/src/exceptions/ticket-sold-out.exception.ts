import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class TicketSoldOutException extends DomainException {
  constructor() {
    super('No hay suficientes boletos disponibles.', HttpStatus.CONFLICT);
  }
}
