import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Concierto de Rock' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2027-10-15T20:00:00Z' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ example: 'Estadio Nacional' })
  @IsString()
  location: string;
}

export class UpdateEventDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;
}
