import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

// ==========================================
// 📋 GET MY NOTIFICATIONS
// ==========================================
export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ notifications });

  } catch (error) {
    console.error("Get Notifications Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🔢 GET UNREAD COUNT
// ==========================================
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const count = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return res.status(200).json({ unreadCount: count });

  } catch (error) {
    console.error("Get Unread Count Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// ✅ MARK NOTIFICATION AS READ
// ==========================================
export const markAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: "Notification not found." });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({ message: "Notification marked as read! ✅" });

  } catch (error) {
    console.error("Mark As Read Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// ✅ MARK ALL AS READ
// ==========================================
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return res.status(200).json({ message: "All notifications marked as read! ✅" });

  } catch (error) {
    console.error("Mark All As Read Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};