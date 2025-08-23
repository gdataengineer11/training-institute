// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import studentsRoutes from './routes/students.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// CORS (dev): allow the Vite dev server
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Static uploads (for documents, if any)
app.use('/uploads', express.static(path.resolve('uploads')));

// ✅ Health endpoints (add BEFORE other middleware/fallbacks)
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
});
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentsRoutes);

// 404 JSON fallback (so you don't see "Cannot GET /...")
app.use((req, res) => {
  res.status(404).json({ message: `Not Found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
