import express, { Request, Response } from 'express';
import stripe, { STRIPE_CONFIG } from '../config/stripe';
import { pool } from '../config/db';
import Stripe from 'stripe';

const router = express.Router();

// Handle Stripe webhooks
router.post('/', express.raw({type: 'application/json'}), async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !STRIPE_CONFIG.webhookSecret) {
        console.error('Missing stripe signature or webhook secret');
        res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
        return;
    }

    let event: Stripe.Event;

    try {
        // Use the raw body for signature verification
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            STRIPE_CONFIG.webhookSecret
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                
                // Get user ID from customer metadata
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                const userId = customer.metadata.userId;

                if (!userId) {
                    throw new Error('No userId found in customer metadata');
                }

                // Update subscription in database
                await pool.query(
                    `INSERT INTO subscriptions 
                    (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type, current_period_end) 
                    VALUES ($1, $2, $3, $4, $5, to_timestamp($6))
                    ON CONFLICT (user_id) DO UPDATE SET 
                    stripe_subscription_id = $3,
                    status = $4,
                    plan_type = $5,
                    current_period_end = to_timestamp($6),
                    updated_at = CURRENT_TIMESTAMP`,
                    [
                        userId,
                        customerId,
                        subscription.id,
                        subscription.status,
                        subscription.items.data[0].price.id,
                        subscription.current_period_end,
                    ]
                );
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                
                // Get user ID from customer metadata
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                const userId = customer.metadata.userId;

                if (!userId) {
                    throw new Error('No userId found in customer metadata');
                }

                // Update subscription status to canceled
                await pool.query(
                    `UPDATE subscriptions 
                    SET status = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = $2`,
                    ['canceled', userId]
                );
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Error processing webhook' });
    }
});

export default router; 