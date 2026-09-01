import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class CloudStorageException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
