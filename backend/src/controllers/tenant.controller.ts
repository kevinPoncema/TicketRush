import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.tenantService.createTenant(name);
  }

  @Get()
  findAll() {
    return this.tenantService.getAllTenants();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantService.getTenant(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body('name') name: string) {
    return this.tenantService.updateTenant(id, name);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }
}
