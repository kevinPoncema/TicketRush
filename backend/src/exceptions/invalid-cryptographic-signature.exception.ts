import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class InvalidCryptographicSignatureException extends DomainException {
  constructor(message: string = 'Firma criptográfica inválida.') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
