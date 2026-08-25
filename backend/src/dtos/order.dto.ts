import { IsUUID, IsString, IsEmail, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderTierItemDto {
  @ApiProperty({ example: 'uuid-del-ticket-tier' })
  @IsUUID()
  ticketTierId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  clientName: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({ type: [OrderTierItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderTierItemDto)
  tiers: OrderTierItemDto[];
}
