import './config/env.js';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const URL = process.env.BASE_URL
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Basic health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    const dbCheck = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: dbCheck.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`NavQuill Backend running on ${URL}`);
});