import { query } from '../config/db';

export async function cleanupExpiredDocuments() {
    try {
        const result = await query(
            'DELETE FROM documents WHERE expires_at IS NOT NULL AND expires_at < NOW() RETURNING id',
        );
        
        if (result.rows.length > 0) {
            console.log(`Cleaned up ${result.rows.length} expired documents`);
        }
    } catch (error) {
        console.error('Error cleaning up expired documents:', error);
    }
} 