import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class OrderAlreadyProcessedException extends DomainException {
  constructor(message: string = 'La orden ya ha sido procesada o finalizada.') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
