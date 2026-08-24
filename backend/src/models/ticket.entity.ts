import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { TicketTier } from './ticket-tier.entity';

export enum TicketStatus {
  RESERVED = 'RESERVED',
  VALID = 'VALID',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'ticket_tier_id' })
  ticketTierId: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.RESERVED })
  status: TicketStatus;

  @Column({ unique: true, nullable: true })
  signature: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Order, order => order.tickets)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => TicketTier, tier => tier.tickets)
  @JoinColumn({ name: 'ticket_tier_id' })
  ticketTier: TicketTier;
}
