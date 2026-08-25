import { IsString, IsUrl, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertTenantConfigDto {
  @ApiProperty({ example: 'https://hooks.zapier.com/hooks/catch/...', required: false })
  @IsUrl({}, { message: 'Must be a valid URL' })
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty({ example: 'tickets.miproductora.com', required: false })
  @IsString()
  @IsOptional()
  customDomain?: string;

  @ApiProperty({ example: '#FF5500', required: false })
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: 'Must be a valid HEX color' })
  @IsOptional()
  brandColor?: string;
}
