import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class EventNotFoundException extends DomainException {
  constructor() {
    super('Evento no encontrado o acceso denegado.', HttpStatus.NOT_FOUND);
  }
}
