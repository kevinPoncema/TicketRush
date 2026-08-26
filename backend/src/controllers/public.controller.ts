import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../models/tenant.entity';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>
  ) { }

  @ApiOperation({ summary: 'Get public information about a tenant' })
  @Get('tenant/:tenantId/info')
  async getTenantInfo(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: { tenantConfig: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      brandColor: tenant.tenantConfig?.brandColor || '#8b5cf6',
      logoUrl: tenant.tenantConfig?.customDomain || '',
      currency: tenant.tenantConfig?.currency || 'usd',
    };
  }
}
