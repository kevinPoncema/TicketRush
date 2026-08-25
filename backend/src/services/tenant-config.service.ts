import { Injectable } from '@nestjs/common';
import { TenantConfigRepository } from '../Repositories/tenant-config.repository';

@Injectable()
export class TenantConfigService {
  constructor(private readonly configRepository: TenantConfigRepository) {}

  async getConfig(tenantId: string) {
    return this.configRepository.findByTenant(tenantId);
  }

  async upsertConfig(tenantId: string, webhookUrl: string) {
    return this.configRepository.upsert(tenantId, webhookUrl);
  }

  async deleteConfig(tenantId: string) {
    return this.configRepository.delete(tenantId);
  }
}
