import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../Repositories/tenant.repository';
import { Tenant } from '../models/tenant.entity';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async createTenant(name: string): Promise<Tenant> {
    return this.tenantRepository.create({ name });
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.findAll();
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.tenantRepository.findById(id);
  }

  async updateTenant(id: string, name: string): Promise<Tenant> {
    return this.tenantRepository.update(id, { name });
  }

  async deleteTenant(id: string): Promise<void> {
    return this.tenantRepository.delete(id);
  }
}
