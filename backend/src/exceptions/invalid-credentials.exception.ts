import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Credenciales inválidas.', HttpStatus.UNAUTHORIZED);
  }
}
