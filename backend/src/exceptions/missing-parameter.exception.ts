import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class MissingParameterException extends DomainException {
  constructor(paramName: string) {
    super(`El parámetro ${paramName} es requerido.`, HttpStatus.BAD_REQUEST);
  }
}
