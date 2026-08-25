import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Nuevo Teatro' })
  @IsString()
  @MinLength(2)
  name: string;
}
