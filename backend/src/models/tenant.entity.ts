import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { TenantConfig } from './tenant-config.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Event, event => event.tenant)
  events: Event[];

  @OneToOne(() => TenantConfig, config => config.tenant)
  tenantConfig: TenantConfig;
}
