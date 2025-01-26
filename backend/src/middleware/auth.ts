import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

export interface UserPayload {
    userId: number;
    // add other payload properties as needed
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

const pool = new Pool();

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserPayload;
        req.user = payload;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
        return;
    }
};

export const checkSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const result = await pool.query(
            `SELECT status FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(403).json({ error: 'Pro subscription required for this feature' });
            return;
        }

        next();
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 