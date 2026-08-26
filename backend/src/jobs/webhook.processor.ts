import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TenantConfigRepository } from '../Repositories/tenant-config.repository';
import { OrderRepository } from '../Repositories/order.repository';

@Processor('webhook-queue')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly tenantConfigRepo: TenantConfigRepository,
    private readonly orderRepo: OrderRepository
  ) {
    super();
  }

  async process(job: Job<{ orderId: string, eventType?: string }, any, string>): Promise<any> {
    const { orderId, eventType } = job.data;

    const order = await this.orderRepo.findByIdWithFullRelations(orderId);

    if (!order || !order.tickets.length) {
      this.logger.warn(`Order ${orderId} not found or has no tickets. Cannot dispatch webhook.`);
      return { skipped: true, reason: 'Order not found' };
    }

    const tenantId = order.tickets[0].ticketTier.event.tenantId;

    const config = await this.tenantConfigRepo.findByTenant(tenantId);

    if (!config || !config.webhookUrl) {
      this.logger.debug(`No webhook configured for tenant ${tenantId}. Skipping notification.`);
      return { skipped: true, reason: 'No Webhook URL configured' };
    }

    const payload = {
      event: eventType || 'ORDER_COMPLETED',
      timestamp: new Date().toISOString(),
      data: {
        orderId: order.id,
        clientName: order.client.name,
        clientEmail: order.client.email,
        totalAmount: order.totalAmount,
        tickets: order.tickets.map(t => ({
          id: t.id,
          tier: t.ticketTier.name,
          signature: t.signature,
        })),
      },
    };

    try {
      this.logger.log(`Dispatching Webhook to ${config.webhookUrl} for Order ${orderId}`);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with HTTP status: ${response.status}`);
      }

      this.logger.log(`Webhook successfully delivered for Order ${orderId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to deliver Webhook for Order ${orderId}: ${error.message}`);
      throw error;
    }
  }
}
