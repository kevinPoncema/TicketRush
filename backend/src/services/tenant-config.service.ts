import { Injectable } from '@nestjs/common';
import { TenantConfigRepository } from '../Repositories/tenant-config.repository';
import { UpsertTenantConfigDto } from '../dtos/tenant-config.dto';

@Injectable()
export class TenantConfigService {
  constructor(private readonly configRepository: TenantConfigRepository) {}

  async getConfig(tenantId: string) {
    return this.configRepository.findByTenant(tenantId);
  }

  async upsertConfig(tenantId: string, data: UpsertTenantConfigDto) {
    return this.configRepository.upsert(tenantId, data);
  }

  async deleteConfig(tenantId: string) {
    return this.configRepository.delete(tenantId);
  }
}
