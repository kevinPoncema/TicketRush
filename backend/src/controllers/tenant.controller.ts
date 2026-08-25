import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../dtos/tenant.dto';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @ApiOperation({ summary: 'Create a new tenant (Direct creation, usually done via auth/register-tenant)' })
  @Post()
  create(@Body() data: CreateTenantDto) {
    return this.tenantService.createTenant(data.name);
  }

  @ApiOperation({ summary: 'Get all tenants (Superadmin level)' })
  @Get()
  findAll() {
    return this.tenantService.getAllTenants();
  }

  @ApiOperation({ summary: 'Get a specific tenant' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantService.getTenant(id);
  }

  @ApiOperation({ summary: 'Update a specific tenant' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: CreateTenantDto) {
    return this.tenantService.updateTenant(id, data.name);
  }

  @ApiOperation({ summary: 'Delete a specific tenant' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }
}
