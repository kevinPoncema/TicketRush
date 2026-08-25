import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderRepository } from '../Repositories/order.repository';
import { OrderStatus } from '../models/order.entity';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(data: any) {
    // TODO: Implementar lógica de Soft Reserve, bloqueo pesimista y creación aquí.
    return { 
      message: 'Lógica de creación de orden pendiente de implementar.',
      dataReceived: data
    };
  }

  async cancelOrder(id: string) {
    const order = await this.orderRepository.findById(id);
    
    // Solo se puede cancelar si está PENDING (es decir, no ha sido pagada ni falló previamente)
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`No se puede cancelar la orden porque su estado actual es ${order.status} (Finalizado)`);
    }

    return this.orderRepository.updateStatus(id, OrderStatus.FAILED);
  }
}
