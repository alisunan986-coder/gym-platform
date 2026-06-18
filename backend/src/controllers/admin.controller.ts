import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

// ==========================================
// 👔 CREATE TRAINER ACCOUNT
// ==========================================
export const createTrainer = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "All fields (firstName, lastName, email, password) are required."
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTrainer = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'TRAINER'
      }
    });

    return res.status(201).json({
      message: "Trainer account created successfully! 💪",
      trainer: {
        id: newTrainer.id,
        firstName: newTrainer.firstName,
        lastName: newTrainer.lastName,
        email: newTrainer.email,
        role: newTrainer.role,
        isActive: newTrainer.isActive
      }
    });

  } catch (error) {
    console.error("Create Trainer Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 GET ALL TRAINERS
// ==========================================
export const getAllTrainers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const trainers = await prisma.user.findMany({
      where: { role: 'TRAINER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { assignedClients: true }
        }
      }
    });

    return res.status(200).json({ trainers });

  } catch (error) {
    console.error("Get All Trainers Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 GET ALL CLIENTS
// ==========================================
export const getAllClients = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
        fitnessProfile: true,
        assignedTrainer: {
          select: {
            trainer: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    return res.status(200).json({ clients });

  } catch (error) {
    console.error("Get All Clients Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🔄 ACTIVATE / DEACTIVATE TRAINER
// ==========================================
export const updateTrainerStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
      const id = req.params.id as string;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "isActive must be true or false." });
    }

    const trainer = await prisma.user.findUnique({ where: { id } });

    if (!trainer || trainer.role !== 'TRAINER') {
      return res.status(404).json({ message: "Trainer not found." });
    }

    const updatedTrainer = await prisma.user.update({
      where: { id },
      data: { isActive }
    });

    return res.status(200).json({
      message: `Trainer ${isActive ? 'activated' : 'deactivated'} successfully! ✅`,
      trainer: {
        id: updatedTrainer.id,
        firstName: updatedTrainer.firstName,
        lastName: updatedTrainer.lastName,
        isActive: updatedTrainer.isActive
      }
    });

  } catch (error) {
    console.error("Update Trainer Status Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🔗 ASSIGN CLIENT TO TRAINER
// ==========================================
export const assignClientToTrainer = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { trainerId, clientId } = req.body;

    if (!trainerId || !clientId) {
      return res.status(400).json({ message: "trainerId and clientId are required." });
    }

    // Verify trainer exists and has correct role
    const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer || trainer.role !== 'TRAINER') {
      return res.status(404).json({ message: "Trainer not found." });
    }

    // Verify client exists and has correct role
    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== 'CLIENT') {
      return res.status(404).json({ message: "Client not found." });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: { trainerId, clientId }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: "This client is already assigned to this trainer." });
    }

    const assignment = await prisma.trainerClient.create({
      data: { trainerId, clientId }
    });

    return res.status(201).json({
      message: "Client assigned to trainer successfully! 🔗",
      assignment
    });

  } catch (error) {
    console.error("Assign Client Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};