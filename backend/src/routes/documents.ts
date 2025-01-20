import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { authenticateToken } from '../middleware/auth';

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
router.post('/', authenticateToken, async (req: Request<{}, {}, CreateDocumentRequest>, res: Response, next: NextFunction) => {
    try {
        const { title, content = '', visibility = 'private' } = req.body;
        const userId = req.user?.id;

        const result = await query<Document>(
            'INSERT INTO documents (title, content, owner_id, visibility) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, userId, visibility]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// Get all documents for authenticated user
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

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
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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

            // Check if user has access
            if (document && document.visibility === 'private') {
                if (!req.user || req.user.id !== document.owner_id) {
                    return res.status(403).json({ error: 'Access denied' });
                }
            }
        } else {
            // Try to find by share ID
            const result = await query<Document>(
                'SELECT * FROM documents WHERE share_id = $1',
                [id]
            );
            document = result.rows[0];
        }

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        next(error);
    }
});

// Update document
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, content, visibility } = req.body;
        const userId = req.user?.id;

        // Check ownership
        const document = await query<Document>(
            'SELECT * FROM documents WHERE id = $1',
            [id]
        );

        if (document.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (document.rows[0].owner_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
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
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // Check ownership
        const document = await query<Document>(
            'SELECT * FROM documents WHERE id = $1',
            [id]
        );

        if (document.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (document.rows[0].owner_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await query('DELETE FROM documents WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export const documentsRouter = router; 