import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY must be defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
});

export default stripe;

export const STRIPE_CONFIG = {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    monthlyPriceId: "price_1QjsFKCT2XDlG7vR2MSNGPAg",
    annualPriceId: "price_1QjsFHCT2XDlG7vRGGAPWT5C",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
}; 