import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import noticeRoutes from './routes/notices';
import settingsRoutes from './routes/settings';
import dashboardRoutes from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup - allow all origins for development/demo ease, or specific frontend domain
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route for health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Central Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Society Maintenance Tracker server listening on port ${PORT}`);
});
