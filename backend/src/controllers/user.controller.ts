import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

// ==========================================
// 👤 GET CURRENT USER
// ==========================================
export const getMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error("Get Me Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// ✏️ UPDATE CURRENT USER
// ==========================================
export const updateMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ 
        message: "firstName and lastName are required." 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.userId },
      data: { firstName, lastName },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    });

    return res.status(200).json({
      message: "Profile updated successfully! ✅",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update Me Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};