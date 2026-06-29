import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

// ==========================================
// 📋 GET MY ASSIGNED CLIENTS
// ==========================================
export const getMyClients = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const trainerId = req.user?.userId as string;

    const assignments = await prisma.trainerClient.findMany({
      where: { trainerId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            fitnessProfile: true
          }
        }
      }
    });

    const clients = assignments.map((a: any) => a.client);

    return res.status(200).json({ clients });

  } catch (error) {
    console.error("Get My Clients Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 GET SPECIFIC CLIENT'S FITNESS PROFILE
// ==========================================
export const getClientProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const trainerId = req.user?.userId as string;
    const clientId = req.params.clientId as string;

    // 1. Verify this client is actually assigned to this trainer
    const assignment = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: { trainerId, clientId }
      }
    });

    if (!assignment) {
      return res.status(403).json({
        message: "Access denied. This client is not assigned to you."
      });
    }

    // 2. Get the client's fitness profile
    const fitnessProfile = await prisma.fitnessProfile.findUnique({
      where: { userId: clientId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!fitnessProfile) {
      return res.status(404).json({
        message: "This client hasn't completed their fitness profile yet."
      });
    }

    return res.status(200).json({ fitnessProfile });

  } catch (error) {
    console.error("Get Client Profile Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};