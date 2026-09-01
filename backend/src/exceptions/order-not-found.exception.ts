import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class OrderNotFoundException extends DomainException {
  constructor() {
    super('Orden no encontrada o PIN incorrecto.', HttpStatus.NOT_FOUND);
  }
}
