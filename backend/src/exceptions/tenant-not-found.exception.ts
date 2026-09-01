import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class TenantNotFoundException extends DomainException {
  constructor() {
    super('Organización no encontrada.', HttpStatus.NOT_FOUND);
  }
}
