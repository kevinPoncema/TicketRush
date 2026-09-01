import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class UserAlreadyExistsException extends DomainException {
  constructor() {
    super('El correo ya está registrado en el sistema.', HttpStatus.CONFLICT);
  }
}
