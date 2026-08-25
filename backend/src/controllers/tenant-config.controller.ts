import { Controller, Get, Put, Delete, Body, Req } from '@nestjs/common';
import { TenantConfigService } from '../services/tenant-config.service';

@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly configService: TenantConfigService) {}

  @Get()
  getConfig(@Req() req: any) {
    return this.configService.getConfig(req.user.tenantId);
  }

  @Put()
  upsertConfig(@Req() req: any, @Body('webhookUrl') webhookUrl: string) {
    return this.configService.upsertConfig(req.user.tenantId, webhookUrl);
  }

  @Delete()
  deleteConfig(@Req() req: any) {
    return this.configService.deleteConfig(req.user.tenantId);
  }
}
