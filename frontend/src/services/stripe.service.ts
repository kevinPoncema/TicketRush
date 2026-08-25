import { loadStripe, Stripe } from '@stripe/stripe-js';


const STRIPE_PUBLIC_KEY = 'pk_test_TYooMQauvdEDq54NiTphI7jx';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};
