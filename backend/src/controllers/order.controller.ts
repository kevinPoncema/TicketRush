import { Controller, Post, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dtos/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: 'Create a new order and reserve tickets' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'Unique key to prevent duplicate orders', required: true })
  @Post()
  create(
    @Headers('Idempotency-Key') idempotencyKey: string, 
    @Body() data: CreateOrderDto
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is strictly required');
    }
    return this.orderService.createOrder(data, idempotencyKey);
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
