import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class TicketAlreadyUsedException extends DomainException {
  constructor() {
    super('El boleto ya fue USADO anteriormente en la puerta.', HttpStatus.BAD_REQUEST);
  }
}
