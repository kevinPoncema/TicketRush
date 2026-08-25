import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dtos/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: 'Create a new order and reserve tickets' })
  @Post()
  create(@Body() data: CreateOrderDto) {
    return this.orderService.createOrder(data);
  }

  @ApiOperation({ summary: 'Simulate processing payment for an order' })
  @Post(':id/process-payment')
  processPayment(@Param('id') id: string) {
    return this.orderService.processPayment(id);
  }

  @ApiOperation({ summary: 'Cancel an order manually (Only if PENDING)' })
  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }
}
