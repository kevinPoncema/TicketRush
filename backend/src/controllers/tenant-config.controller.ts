import { Controller, Get, Put, Delete, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantConfigService } from '../services/tenant-config.service';
import { UpsertTenantConfigDto } from '../dtos/tenant-config.dto';

@ApiTags('Tenant Configuration')
@ApiBearerAuth()
@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly configService: TenantConfigService) {}

  @ApiOperation({ summary: 'Get configuration for the authenticated tenant' })
  @Get()
  getConfig(@Req() req: any) {
    return this.configService.getConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Upsert (Create or Update) configuration' })
  @Put()
  upsertConfig(@Req() req: any, @Body() data: UpsertTenantConfigDto) {
    return this.configService.upsertConfig(req.user.tenantId, data.webhookUrl || '');
  }

  @ApiOperation({ summary: 'Delete configuration' })
  @Delete()
  deleteConfig(@Req() req: any) {
    return this.configService.deleteConfig(req.user.tenantId);
  }
}
