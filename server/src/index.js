// server/src/index.js
import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import { errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------- Security / CORS ---------- */
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowed, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));

/* ---------- Logging ---------- */
app.use(morgan('dev'));

/* ---------- Body parsers ---------- */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Static ---------- */
app.use('/uploads', express.static(path.resolve('uploads')));

/* ---------- Disable HTTP caching for APIs ---------- */
// Turn off ETag so Express won't return 304 on identical bodies
app.set('etag', false);
// And add explicit no-cache headers
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
}
app.use('/api', noCache);

/* ---------- Health ---------- */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ---------- Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);

/* ---------- Errors ---------- */
app.use(errorHandler);

/* ---------- Start ---------- */
const PORT = process.env.PORT || 4000;
function maskDb(url) {
  try { const u = new URL(url); return `${u.protocol}//${u.hostname}:${u.port}${u.pathname}`; }
  catch { return 'UNKNOWN_DB_URL'; }
}
app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
  console.log(`[DB] ${maskDb(process.env.DATABASE_URL || '')}`);
});
