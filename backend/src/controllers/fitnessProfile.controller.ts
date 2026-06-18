import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

// ==========================================
// 💪 CREATE FITNESS PROFILE
// ==========================================
export const createFitnessProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      age,
      gender,
      height,
      weight,
      fitnessLevel,
      fitnessGoal,
      workoutDaysPerWeek,
      availableEquipment,
      dietaryPreferences,
      allergies,
      medicalConditions,
      cuisinePreference
    } = req.body;

    // 1. Validation
    if (!age || !gender || !height || !weight || !fitnessLevel || !fitnessGoal || !workoutDaysPerWeek) {
      return res.status(400).json({
        message: "Required fields: age, gender, height, weight, fitnessLevel, fitnessGoal, workoutDaysPerWeek"
      });
    }

    // 2. Check if profile already exists
    const existingProfile = await prisma.fitnessProfile.findUnique({
      where: { userId: req.user?.userId }
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "Fitness profile already exists. Use PUT to update it."
      });
    }

    // 3. Create profile
    const profile = await prisma.fitnessProfile.create({
      data: {
        userId: req.user?.userId as string,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        fitnessLevel,
        fitnessGoal,
        workoutDaysPerWeek: Number(workoutDaysPerWeek),
        availableEquipment: availableEquipment || [],
        dietaryPreferences: dietaryPreferences || [],
        allergies: allergies || [],
        medicalConditions: medicalConditions || [],
         cuisinePreference: cuisinePreference || 'Ethiopian'
      }
    });

    return res.status(201).json({
      message: "Fitness profile created successfully! 💪",
      profile
    });

  } catch (error) {
    console.error("Create Fitness Profile Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 GET FITNESS PROFILE
// ==========================================
export const getFitnessProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId: req.user?.userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: "Fitness profile not found. Please create one first."
      });
    }

    return res.status(200).json({ profile });

  } catch (error) {
    console.error("Get Fitness Profile Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// ✏️ UPDATE FITNESS PROFILE
// ==========================================
export const updateFitnessProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      age,
      gender,
      height,
      weight,
      fitnessLevel,
      fitnessGoal,
      workoutDaysPerWeek,
      availableEquipment,
      dietaryPreferences,
      allergies,
      medicalConditions,
      cuisinePreference
    } = req.body;

    // 1. Check if profile exists
    const existingProfile = await prisma.fitnessProfile.findUnique({
      where: { userId: req.user?.userId }
    });

    if (!existingProfile) {
      return res.status(404).json({
        message: "Fitness profile not found. Please create one first."
      });
    }

    // 2. Update profile
    const updatedProfile = await prisma.fitnessProfile.update({
      where: { userId: req.user?.userId },
      data: {
        ...(age && { age: Number(age) }),
        ...(gender && { gender }),
        ...(height && { height: Number(height) }),
        ...(weight && { weight: Number(weight) }),
        ...(fitnessLevel && { fitnessLevel }),
        ...(fitnessGoal && { fitnessGoal }),
        ...(workoutDaysPerWeek && { workoutDaysPerWeek: Number(workoutDaysPerWeek) }),
        ...(availableEquipment && { availableEquipment }),
        ...(dietaryPreferences && { dietaryPreferences }),
        ...(allergies && { allergies }),
        ...(medicalConditions && { medicalConditions }),
        ...(cuisinePreference && { cuisinePreference })
      }
    });

    return res.status(200).json({
      message: "Fitness profile updated successfully! ✅",
      profile: updatedProfile
    });

  } catch (error) {
    console.error("Update Fitness Profile Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};