import "server-only";
import Stripe from "stripe";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return cached;
}
