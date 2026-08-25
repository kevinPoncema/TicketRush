import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertTenantConfigDto {
  @ApiProperty({ example: 'https://hooks.zapier.com/hooks/catch/...', required: false })
  @IsUrl()
  @IsOptional()
  webhookUrl?: string;
}
