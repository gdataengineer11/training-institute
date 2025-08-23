import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { summaryHandler } from '../controllers/dashboard.controller.js';

const router = Router();
router.get('/summary', requireAuth, summaryHandler);

export default router;
