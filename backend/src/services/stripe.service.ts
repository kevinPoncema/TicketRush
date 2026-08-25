import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no está definida en el .env');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2022-11-15' as any,
    });
  }

  async createPaymentIntent(amount: number, orderId: string, currency: string = 'usd'): Promise<string> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { orderId },
    });
    return paymentIntent.client_secret || '';
  }
}
