import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { query } from './config/db';

interface Document {
    id: number;
    title: string;
    content: string;
    owner_id: number;
}

export const setupSocketIO = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
            socket.data.userId = payload.userId;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('join-document', async (documentId) => {
            socket.join(documentId.toString());
            console.log(`Client joined document: ${documentId}`);
        });

        socket.on('document-change', async (data: { documentId: string; content: string }) => {
            try {
                // Try to find document by numeric ID first, then by share ID if that fails
                let updateQuery = 'UPDATE documents SET content = $1 WHERE ';
                let params = [data.content];

                if (!isNaN(Number(data.documentId))) {
                    updateQuery += 'id = $2';
                    params.push(data.documentId);
                } else {
                    updateQuery += 'share_id = $2';
                    params.push(data.documentId);
                }

                await query<Document>(updateQuery, params);

                // Broadcast the change to all clients in the document room except the sender
                socket.to(data.documentId.toString()).emit('document-change', data.content);
            } catch (error) {
                console.error('Error updating document:', error);
            }
        });

        socket.on('cursor-update', (data: { documentId: string; position: any }) => {
            socket.to(data.documentId.toString()).emit('cursor-update', {
                userId: socket.data.userId,
                position: data.position
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
}; 