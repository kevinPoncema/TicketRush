import { Entity, Column, UpdateDateColumn, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_configs')
export class TenantConfig {
  @PrimaryColumn({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl: string;

  @Column({ name: 'custom_domain', nullable: true })
  customDomain: string;

  @Column({ name: 'brand_color', nullable: true, default: '#8b5cf6' })
  brandColor: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Tenant, tenant => tenant.tenantConfig)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
