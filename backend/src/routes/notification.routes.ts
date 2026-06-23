import { Router } from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../controllers/notification.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', verifyToken, getMyNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);

export default router;