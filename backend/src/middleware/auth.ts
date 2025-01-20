import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
    userId: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserPayload;
        req.user = payload;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}; 