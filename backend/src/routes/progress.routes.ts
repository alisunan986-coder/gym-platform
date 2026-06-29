import { Router } from 'express';
import {
  logProgress,
  getProgressLogs,
  getProgressInsights,
  deleteProgressLog
} from '../controllers/progress.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { requireSubscription } from '../middleware/subscription.middleware';


const router = Router();

router.post('/', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), logProgress);
router.get('/', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), getProgressLogs);
router.post('/insights', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), getProgressInsights);
router.delete('/:id', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), deleteProgressLog);

export default router;