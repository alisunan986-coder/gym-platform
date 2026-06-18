import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { generateJSON, buildWorkoutPrompt, buildMealPlanPrompt } from '../services/gemini.service';

// ==========================================
// 💪 GENERATE AI WORKOUT PLAN
// ==========================================
export const generateWorkoutPlan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    // 1. Get the client's fitness profile
    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: "Please complete your fitness profile before generating a workout plan."
      });
    }

    // 2. Build prompt and call Gemini
    const prompt = buildWorkoutPrompt(profile);
    const aiResponse = await generateJSON(prompt);

    // 3. Save to database
    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        userId,
        title: aiResponse.title,
        description: aiResponse.description,
        isAiGenerated: true,
        weeklySchedule: aiResponse.weeklySchedule
      }
    });

    return res.status(201).json({
      message: "Workout plan generated successfully! 💪",
      workoutPlan
    });

  } catch (error) {
    console.error("Generate Workout Plan Error: ", error);
    return res.status(500).json({ message: "Failed to generate workout plan. Please try again." });
  }
};

// ==========================================
// 📋 GET MY WORKOUT PLANS
// ==========================================
export const getMyWorkoutPlans = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const workoutPlans = await prisma.workoutPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ workoutPlans });

  } catch (error) {
    console.error("Get Workout Plans Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🥗 GENERATE AI MEAL PLAN
// ==========================================
export const generateMealPlan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    // 1. Get the client's fitness profile
    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: "Please complete your fitness profile before generating a meal plan."
      });
    }

    // 2. Build prompt and call Gemini
    const prompt = buildMealPlanPrompt(profile);
    const aiResponse = await generateJSON(prompt);

    // 3. Save to database
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        title: aiResponse.title,
        isAiGenerated: true,
        dailyCalories: aiResponse.dailyCalories,
        proteinGrams: aiResponse.proteinGrams,
        meals: aiResponse.meals
      }
    });

    return res.status(201).json({
      message: "Meal plan generated successfully! 🥗",
      mealPlan
    });

  } catch (error) {
    console.error("Generate Meal Plan Error: ", error);
    return res.status(500).json({ message: "Failed to generate meal plan. Please try again." });
  }
};

// ==========================================
// 📋 GET MY MEAL PLANS
// ==========================================
export const getMyMealPlans = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const mealPlans = await prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ mealPlans });

  } catch (error) {
    console.error("Get Meal Plans Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};