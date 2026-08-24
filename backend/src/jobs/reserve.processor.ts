import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('reserve-queue')
export class ReserveProcessor extends WorkerHost {
  private readonly logger = new Logger(ReserveProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name} with data:`, job.data);
    
    if (job.name === 'check-payment-status') {
      const { orderId } = job.data;
      
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      
      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return;
      }

      if (order.status === 'PENDING') {
        this.logger.log(`Order ${orderId} is still pending. Canceling order and returning stock...`);
        // Aqui iria la logica de devolver el stock (availableStock) 
        // a traves de una transaccion
        
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'FAILED' }
        });
        
        this.logger.log(`Order ${orderId} marked as FAILED.`);
      } else {
        this.logger.log(`Order ${orderId} is already PAID. Nothing to do.`);
      }
    }
  }
}
