import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Event } from './event.entity';
import { Ticket } from './ticket.entity';

@Entity('ticket_tiers')
export class TicketTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  capacity: number;

  @Column({ name: 'available_stock' })
  availableStock: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Event, event => event.ticketTiers)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @OneToMany(() => Ticket, ticket => ticket.ticketTier)
  tickets: Ticket[];
}
