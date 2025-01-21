import express, { Request, Response } from 'express';
import stripe, { STRIPE_CONFIG } from '../config/stripe';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/db';
import Stripe from 'stripe';

interface CreateCheckoutSessionBody {
    priceType: 'monthly' | 'annual';
}

const router = express.Router();

// Get subscription status
router.get('/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const result = await pool.query(
            `SELECT status, plan_type as "planType", current_period_end as "currentPeriodEnd"
            FROM subscriptions 
            WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.json({
                status: 'inactive',
                planType: null,
                currentPeriodEnd: null,
            });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
});

// Create a Stripe checkout session
router.post('/create-checkout-session', authenticateToken, async (req: Request<{}, {}, CreateCheckoutSessionBody>, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { priceType } = req.body;
        const priceId = priceType === 'annual' ? STRIPE_CONFIG.annualPriceId : STRIPE_CONFIG.monthlyPriceId;

        if (!priceId) {
            res.status(400).json({ error: 'Invalid price type' });
            return;
        }

        // Get or create Stripe customer
        const result = await pool.query(
            'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
            [userId]
        );

        let customerId: string;
        
        if (result.rows.length > 0) {
            customerId = result.rows[0].stripe_customer_id;
        } else {
            // Get user email
            const userResult = await pool.query(
                'SELECT email FROM users WHERE id = $1',
                [userId]
            );
            
            const customer = await stripe.customers.create({
                email: userResult.rows[0].email,
                metadata: {
                    userId: userId.toString(),
                },
            });
            customerId = customer.id;
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig || !STRIPE_CONFIG.webhookSecret) {
        res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
        return;
    }

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            STRIPE_CONFIG.webhookSecret
        );

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
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook error' });
    }
});

export default router; 