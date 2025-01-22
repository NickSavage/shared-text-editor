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

// Create a billing portal session
router.post('/create-portal-session', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        // Get Stripe customer ID
        const result = await pool.query(
            'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
            res.status(400).json({ error: 'No subscription found' });
            return;
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: result.rows[0].stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/profile`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});

export default router; 