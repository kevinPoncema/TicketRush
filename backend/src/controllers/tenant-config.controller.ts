import { Controller, Get, Put, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantConfigService } from '../services/tenant-config.service';
import { UpsertTenantConfigDto } from '../dtos/tenant-config.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';

@ApiTags('Tenant Configuration')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
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
    return this.configService.upsertConfig(req.user.tenantId, data);
  }

  @ApiOperation({ summary: 'Delete configuration' })
  @Delete()
  deleteConfig(@Req() req: any) {
    return this.configService.deleteConfig(req.user.tenantId);
  }
}
