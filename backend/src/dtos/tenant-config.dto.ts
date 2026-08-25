import { IsString, IsUrl, IsOptional, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertTenantConfigDto {
  @ApiProperty({ example: 'https://hooks.zapier.com/hooks/catch/...', required: false })
  @ValidateIf(o => o.webhookUrl !== undefined && o.webhookUrl !== null && o.webhookUrl.trim() !== '')
  @IsUrl({}, { message: 'Must be a valid URL' })
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty({ example: 'tickets.miproductora.com', required: false })
  @ValidateIf(o => o.customDomain !== undefined && o.customDomain !== null && o.customDomain.trim() !== '')
  @IsString()
  @IsOptional()
  customDomain?: string;

  @ApiProperty({ example: '#FF5500', required: false })
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: 'Must be a valid HEX color' })
  @IsOptional()
  brandColor?: string;

  @ApiProperty({ example: 'usd', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
