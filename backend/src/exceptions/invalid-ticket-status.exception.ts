import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class InvalidTicketStatusException extends DomainException {
  constructor(status: string) {
    super(`El boleto no es válido para ingreso. Estado actual: ${status}`, HttpStatus.BAD_REQUEST);
  }
}
