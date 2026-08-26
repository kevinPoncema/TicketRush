import { Controller, Post, Body, Param, Headers, BadRequestException, Get, Query, StreamableFile, Res, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import type { Response } from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { OrderService } from '../services/order.service';
import { PdfService } from '../services/pdf.service';
import { CreateOrderDto } from '../dtos/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly pdfService: PdfService
  ) { }

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

  @Post('recover')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async recoverOrder(@Body() body: { email: string; accessPin: string }) {
    return this.orderService.recoverOrder(body.email, body.accessPin);
  }

  @Get(':id')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getOrderCloud(
    @Param('id') id: string,
    @Query('email') email: string,
    @Query('accessPin') accessPin: string
  ) {
    const order = await this.orderService.recoverOrder(email, accessPin);
    if (order.id !== id) {
      throw new BadRequestException('ID mismatch');
    }
    return order;
  }

  @Get(':id/pdf')
  @UseGuards(ThrottlerGuard)
  async downloadPdf(
    @Param('id') id: string,
    @Query('email') email: string,
    @Query('accessPin') accessPin: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const order = await this.orderService.recoverOrder(email, accessPin);

    if (order.id !== id) {
      throw new BadRequestException('ID mismatch');
    }

    const pdfStream = await this.pdfService.generateOrderPdf(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticketrush-order-${id}.pdf"`,
    });

    return new StreamableFile(pdfStream);
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
