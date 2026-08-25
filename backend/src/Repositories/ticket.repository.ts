import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Ticket, TicketStatus } from '../models/ticket.entity';

@Injectable()
export class TicketRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly repository: Repository<Ticket>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(Ticket) : this.repository;
  }

  async createTickets(tickets: Partial<Ticket>[], manager?: EntityManager): Promise<Ticket[]> {
    const repo = this.getRepo(manager);
    const instances = repo.create(tickets);
    return repo.save(instances);
  }

  async saveBulk(tickets: Ticket[], manager?: EntityManager): Promise<Ticket[]> {
    const repo = this.getRepo(manager);
    return repo.save(tickets);
  }
  
  async updateStatusByOrder(orderId: string, status: TicketStatus, manager?: EntityManager) {
    const repo = this.getRepo(manager);
    await repo.update({ orderId }, { status });
  }
}
