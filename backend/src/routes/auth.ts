import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

interface User {
    id: number;
    email: string;
    password_hash: string;
    username: string;
}

interface RegisterRequest {
    email: string;
    password: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const result = await query<User>(
            'SELECT id, email, username FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = result.rows[0];
        res.json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
        next(error);
    }
});

router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user with email as username
        const result = await query<User>(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username',
            [email, passwordHash, email]
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ user: { id: user.id, email: user.email, username: user.username }, token });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await query<User>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
    } catch (error) {
        next(error);
    }
});

export const authRouter = router; 