import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51MockKeyABC123', {
      apiVersion: '2022-11-15' as any,
    });
  }

  async createPaymentIntent(amount: number, orderId: string): Promise<string> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { orderId },
    });
    return paymentIntent.client_secret || '';
  }
}
