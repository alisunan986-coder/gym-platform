import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateMe);

export default router;