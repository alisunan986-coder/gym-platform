import { Router } from 'express';
import { sendMessage, getChatHistory, clearChatHistory } from '../controllers/chat.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { requireSubscription } from '../middleware/subscription.middleware';


const router = Router();

// All routes require CLIENT role
router.post('/message', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), sendMessage);
router.get('/history', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), getChatHistory);
router.delete('/history', verifyToken, requireRole('CLIENT'), requireSubscription('Pro'), clearChatHistory);

export default router;