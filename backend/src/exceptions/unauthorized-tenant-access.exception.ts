import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class UnauthorizedTenantAccessException extends DomainException {
  constructor() {
    super('No tienes acceso a este recurso.', HttpStatus.FORBIDDEN);
  }
}
