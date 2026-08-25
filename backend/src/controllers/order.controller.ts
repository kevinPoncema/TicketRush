import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dtos/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: 'Create a new order (Logic pending)' })
  @Post()
  create(@Body() data: CreateOrderDto) {
    return this.orderService.createOrder(data);
  }

  @ApiOperation({ summary: 'Cancel an order (Only if PENDING)' })
  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }
}
