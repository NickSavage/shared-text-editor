import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketIO } from './websocket';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { documentsRouter } from './routes/documents';

dotenv.config();

const app = express();
const server = createServer(app);

// Setup Socket.IO
setupSocketIO(server);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 