import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class SelfDeletionNotAllowedException extends DomainException {
  constructor() {
    super('No puedes eliminarte a ti mismo.', HttpStatus.FORBIDDEN);
  }
}
