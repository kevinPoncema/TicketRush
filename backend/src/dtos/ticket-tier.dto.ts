import { IsString, IsNumber, Min, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketTierDto {
  @ApiProperty({ example: 'uuid-del-evento' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ example: 'VIP' })
  @IsString()
  name: string;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  availableStock: number;
}

export class UpdateTicketTierDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  availableStock?: number;
}
