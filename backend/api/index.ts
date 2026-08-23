// Vercel serverless entry point.
// Wraps the Express app so Vercel can invoke it as a function.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../src/routes/auth';
import complaintRoutes from '../src/routes/complaints';
import noticeRoutes from '../src/routes/notices';
import settingsRoutes from '../src/routes/settings';
import dashboardRoutes from '../src/routes/dashboard';
import { errorHandler } from '../src/middleware/errorHandler';

dotenv.config();

const app = express();

// CORS — allow requests from the deployed frontend + localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Central error handler
app.use(errorHandler);

// Export the app — Vercel calls this as a serverless function
export default app;
