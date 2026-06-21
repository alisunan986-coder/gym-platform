import { Router } from 'express';
import {
  logProgress,
  getProgressLogs,
  getProgressInsights,
  deleteProgressLog
} from '../controllers/progress.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifyToken, requireRole('CLIENT'), logProgress);
router.get('/', verifyToken, requireRole('CLIENT'), getProgressLogs);
router.post('/insights', verifyToken, requireRole('CLIENT'), getProgressInsights);
router.delete('/:id', verifyToken, requireRole('CLIENT'), deleteProgressLog);

export default router;