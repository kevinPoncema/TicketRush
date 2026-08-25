import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketDto {
  @ApiProperty({ example: 'uuid-del-ticket' })
  @IsUUID()
  ticketId: string;

  @ApiProperty({ example: 'a9b4c2...' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
