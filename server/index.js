import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import requestIp from 'request-ip';
import { checkIpBan } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import banRoutes from './routes/bans.js';
import analyticsRoutes from './routes/analytics.js';
import clientRoutes from './routes/clients.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true
}));
app.use(requestIp.mw());
app.use(checkIpBan);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bans', banRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/clients', clientRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});