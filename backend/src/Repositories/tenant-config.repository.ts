import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConfig } from '../models/tenant-config.entity';
import { UpsertTenantConfigDto } from '../dtos/tenant-config.dto';

@Injectable()
export class TenantConfigRepository {
  constructor(
    @InjectRepository(TenantConfig)
    private readonly repository: Repository<TenantConfig>,
  ) {}

  async findByTenant(tenantId: string): Promise<TenantConfig> {
    const config = await this.repository.findOne({ where: { tenantId } });
    if (!config) throw new NotFoundException('Config not found for this tenant');
    return config;
  }

  async upsert(tenantId: string, data: UpsertTenantConfigDto): Promise<TenantConfig> {
    const existing = await this.repository.findOne({ where: { tenantId } });
    
    if (existing) {
      if (data.webhookUrl !== undefined) existing.webhookUrl = data.webhookUrl;
      if (data.customDomain !== undefined) existing.customDomain = data.customDomain;
      if (data.brandColor !== undefined) existing.brandColor = data.brandColor;
      if (data.currency !== undefined) existing.currency = data.currency;
      if (data.logoUrl !== undefined) existing.logoUrl = data.logoUrl;
      if (data.bannerUrl !== undefined) existing.bannerUrl = data.bannerUrl;
      return this.repository.save(existing);
    } else {
      const newConfig = this.repository.create({ 
        tenantId, 
        webhookUrl: data.webhookUrl,
        customDomain: data.customDomain,
        brandColor: data.brandColor || '#8b5cf6',
        currency: data.currency || 'usd',
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl
      });
      return this.repository.save(newConfig);
    }
  }

  async delete(tenantId: string): Promise<void> {
    const result = await this.repository.delete({ tenantId });
    if (result.affected === 0) throw new NotFoundException('Config not found');
  }
}
