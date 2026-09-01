import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class TicketNotFoundException extends DomainException {
  constructor() {
    super('Boleto no encontrado.', HttpStatus.NOT_FOUND);
  }
}
