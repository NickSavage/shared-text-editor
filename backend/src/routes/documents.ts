import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { authenticateToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const router = Router();

interface Document {
    id: number;
    title: string;
    content: string;
    owner_id: number;
    share_id: string;
    visibility: 'private' | 'public';
}

interface CreateDocumentRequest {
    title: string;
    content?: string;
    visibility?: 'private' | 'public';
}

// Create a new document
router.post('/', authenticateToken, async (req: Request<{}, {}, CreateDocumentRequest>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, content = '', visibility = 'private' } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const result = await query<Document>(
            'INSERT INTO documents (title, content, owner_id, visibility) VALUES ($1, $2, $3, $4) RETURNING id, title, content, owner_id, share_id, visibility',
            [title, content, userId, visibility]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Get all documents for authenticated user
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const result = await query<Document>(
            'SELECT * FROM documents WHERE owner_id = $1 ORDER BY id DESC',
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// Get document by ID or share ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        let document;

        // Try to find by numeric ID first
        if (!isNaN(Number(id))) {
            const result = await query<Document>(
                'SELECT * FROM documents WHERE id = $1',
                [id]
            );
            document = result.rows[0];

            // For numeric IDs, private documents need authentication and ownership
            if (document && document.visibility === 'private') {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                
                if (!token) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }

                try {
                    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
                    if (payload.userId !== document.owner_id) {
                        res.status(403).json({ error: 'Access denied' });
                        return;
                    }
                } catch (error) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }
            }
        } else {
            // Try to find by share ID - no authentication needed
            const result = await query<Document>(
                'SELECT * FROM documents WHERE share_id = $1',
                [id]
            );
            document = result.rows[0];
        }

        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        res.json(document);
    } catch (error) {
        next(error);
    }
});

// Get document by share ID
router.get('/shared/:share_id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { share_id } = req.params;
        const result = await query<Document>(
            'SELECT * FROM documents WHERE share_id = $1',
            [share_id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Update document
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content, visibility } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Check ownership
        const document = await query<Document>(
            'SELECT * FROM documents WHERE id = $1',
            [id]
        );

        if (document.rows.length === 0) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        if (document.rows[0].owner_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const result = await query<Document>(
            'UPDATE documents SET title = $1, content = $2, visibility = $3 WHERE id = $4 RETURNING *',
            [title, content, visibility, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Delete document
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Check ownership
        const document = await query<Document>(
            'SELECT * FROM documents WHERE id = $1',
            [id]
        );

        if (document.rows.length === 0) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        if (document.rows[0].owner_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await query('DELETE FROM documents WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export const documentsRouter = router; 