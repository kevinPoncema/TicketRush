import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConfig } from '../models/tenant-config.entity';

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

  async upsert(tenantId: string, webhookUrl: string): Promise<TenantConfig> {
    const existing = await this.repository.findOne({ where: { tenantId } });
    
    if (existing) {
      existing.webhookUrl = webhookUrl;
      return this.repository.save(existing);
    } else {
      const newConfig = this.repository.create({ tenantId, webhookUrl });
      return this.repository.save(newConfig);
    }
  }

  async delete(tenantId: string): Promise<void> {
    const result = await this.repository.delete({ tenantId });
    if (result.affected === 0) throw new NotFoundException('Config not found');
  }
}
