// server/src/routes/inventory.routes.js
import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import * as C from '../controllers/inventory.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/inventory' });

router.get('/meta', requireAuth, C.getMeta);

router.get('/', requireAuth, C.listItems);
router.get('/:id', requireAuth, C.getItem);

router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), upload.single('image'), C.createItem);
router.put('/:id', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), upload.single('image'), C.updateItem);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.archiveItem);

router.post('/:id/issue', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.issueStock);
router.post('/:id/receive', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.receiveStock);
router.post('/:id/adjust', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.adjustStock);
router.post('/:id/return', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.returnStock);
router.post('/:id/dispose', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.disposeStock);

router.post('/bulk', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.bulkAction);

router.get('/export', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), C.exportItems);
router.post('/import', requireAuth, requireRole('ADMIN', 'MANAGER', 'FINANCE'), upload.single('file'), C.importCsv);

export default router;
