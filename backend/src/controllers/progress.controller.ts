import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// ==========================================
// 📝 LOG PROGRESS
// ==========================================
export const logProgress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;
    const { weight, bodyFat, chest, waist, hips, notes } = req.body;

    if (!weight) {
      return res.status(400).json({ message: "Weight is required to log progress." });
    }

    const progressLog = await prisma.progressLog.create({
      data: {
        userId,
        weight: Number(weight),
        bodyFat: bodyFat ? Number(bodyFat) : null,
        chest: chest ? Number(chest) : null,
        waist: waist ? Number(waist) : null,
        hips: hips ? Number(hips) : null,
        notes: notes || null
      }
    });

    return res.status(201).json({
      message: "Progress logged successfully! Keep it up! 💪",
      progressLog
    });

  } catch (error) {
    console.error("Log Progress Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 📋 GET MY PROGRESS LOGS
// ==========================================
export const getProgressLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const logs = await prisma.progressLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    if (logs.length === 0) {
      return res.status(200).json({
        logs: [],
        summary: null
      });
    }

    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const weightChange = Number(((lastLog.weight ?? 0) - (firstLog.weight ?? 0)).toFixed(1));

    return res.status(200).json({
      logs,
      summary: {
        totalLogs: logs.length,
        startingWeight: firstLog.weight,
        currentWeight: lastLog.weight,
        weightChange,
        weightChangeDirection: weightChange < 0 ? 'lost' : weightChange > 0 ? 'gained' : 'maintained'
      }
    });

  } catch (error) {
    console.error("Get Progress Logs Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🧠 GET AI PROGRESS INSIGHTS
// ==========================================
export const getProgressInsights = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    // Extract language from request body
    const { language } = req.body;
    const responseLanguage = language || 'English';
    console.log('🌍 Language requested:', responseLanguage); 


    // 1. Get fitness profile, user info and logs
    const [profile, user, logs] = await Promise.all([
      prisma.fitnessProfile.findUnique({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true }
      }),
      prisma.progressLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    if (!profile) {
      return res.status(404).json({
        message: "Please complete your fitness profile first."
      });
    }

    if (logs.length < 2) {
      return res.status(400).json({
        message: "You need at least 2 progress logs to get insights. Keep logging! 💪"
      });
    }

    // 2. Build progress data string for Gemini
    const progressData = logs.map((log, index) => {
      const date = new Date(log.createdAt).toLocaleDateString();
      return `Entry ${index + 1} (${date}): Weight: ${log.weight}kg${log.bodyFat ? `, Body Fat: ${log.bodyFat}%` : ''}${log.waist ? `, Waist: ${log.waist}cm` : ''}${log.chest ? `, Chest: ${log.chest}cm` : ''}${log.hips ? `, Hips: ${log.hips}cm` : ''}${log.notes ? `, Notes: "${log.notes}"` : ''}`;
    }).join('\n');

    // 3. Build prompt
    const prompt = `You are a fitness coach analyzing a client's progress data.

Client: ${user?.firstName}
Goal: ${profile.fitnessGoal}
Fitness Level: ${profile.fitnessLevel}
Starting Weight: ${logs[0].weight}kg
Current Weight: ${logs[logs.length - 1].weight}kg

Progress History:
${progressData}

Please provide:
1. Overall progress assessment
2. Whether they are on track for their goal (${profile.fitnessGoal})
3. Any plateau detection (if weight hasn't changed in recent entries)
4. Specific recommendations to improve results
5. Motivational message

Keep the response warm, encouraging and practical. Maximum 4-5 paragraphs.
CRITICAL INSTRUCTION: You MUST respond ENTIRELY in ${responseLanguage} language. 
Every single word of your response must be in ${responseLanguage}.
Do NOT use English if the language is Amharic.
Do NOT mix languages under any circumstances.
This is non-negotiable.`;
    // 4. Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const insights = result.response.text();

    return res.status(200).json({
      insights,
      summary: {
        totalLogs: logs.length,
        startingWeight: logs[0].weight,
        currentWeight: logs[logs.length - 1].weight,
        weightChange: Number(((logs[logs.length - 1].weight ?? 0) - (logs[0].weight ?? 0)).toFixed(1))
      }
    });

  } catch (error) {
    console.error("Get Progress Insights Error: ", error);
    return res.status(500).json({ message: "Failed to generate insights. Please try again." });
  }
};

// ==========================================
// 🗑️ DELETE PROGRESS LOG
// ==========================================
export const deleteProgressLog = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;
    const id = req.params.id as string;

    const log = await prisma.progressLog.findUnique({ where: { id } });

    if (!log || log.userId !== userId) {
      return res.status(404).json({ message: "Progress log not found." });
    }

    await prisma.progressLog.delete({ where: { id } });

    return res.status(200).json({ message: "Progress log deleted successfully! ✅" });

  } catch (error) {
    console.error("Delete Progress Log Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};