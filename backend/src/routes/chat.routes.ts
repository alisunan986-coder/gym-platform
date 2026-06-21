import { Router } from 'express';
import { sendMessage, getChatHistory, clearChatHistory } from '../controllers/chat.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require CLIENT role
router.post('/message', verifyToken, requireRole('CLIENT'), sendMessage);
router.get('/history', verifyToken, requireRole('CLIENT'), getChatHistory);
router.delete('/history', verifyToken, requireRole('CLIENT'), clearChatHistory);

export default router;