import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../models/tenant.entity';
import { EventService } from '../services/event.service';

@ApiTags('Public')
@Controller('public/tenants')
export class PublicController {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly eventService: EventService
  ) { }

  @ApiOperation({ summary: 'Get public information about a tenant' })
  @Get(':id')
  async getTenantInfo(@Param('id') tenantId: string) {
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
      logoUrl: tenant.tenantConfig?.logoUrl || '',
      currency: tenant.tenantConfig?.currency || 'usd',
    };
  }

  @ApiOperation({ summary: 'List paginated public store events for a tenant' })
  @Get(':id/events')
  async getTenantEvents(
    @Param('id') tenantId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status: 'upcoming' | 'past' = 'upcoming'
  ) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    
    return this.eventService.getPublicEvents(tenantId, parseInt(page), parseInt(limit), status);
  }
}
