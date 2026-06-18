import { Router } from 'express';
import { getMyClients, getClientProfile } from '../controllers/trainer.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/my-clients', verifyToken, requireRole('TRAINER'), getMyClients);
router.get('/clients/:clientId/profile', verifyToken, requireRole('TRAINER'), getClientProfile);

export default router;
