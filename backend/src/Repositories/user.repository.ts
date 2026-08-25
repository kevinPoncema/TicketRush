import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    return this.repository.find({
      where: { tenantId },
      select: ['id', 'name', 'email', 'role', 'createdAt'] // Don't return passwords
    });
  }

  async deleteByIdAndTenant(id: string, tenantId: string): Promise<void> {
    await this.repository.delete({ id, tenantId });
  }
}
