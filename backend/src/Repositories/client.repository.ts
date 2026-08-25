import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Client } from '../models/client.entity';

@Injectable()
export class ClientRepository {
  constructor(
    @InjectRepository(Client)
    private readonly repository: Repository<Client>,
  ) {}

  private getRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(Client) : this.repository;
  }

  async findOrCreate(email: string, name: string, manager?: EntityManager): Promise<Client> {
    const repo = this.getRepo(manager);
    let client = await repo.findOne({ where: { email } });
    if (!client) {
      client = repo.create({ email, name });
      client = await repo.save(client);
    }
    return client;
  }
}
