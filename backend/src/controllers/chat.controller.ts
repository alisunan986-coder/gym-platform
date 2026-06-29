import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateChatResponse } from '../services/gemini.service';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// ==========================================
// 🤖 BUILD SYSTEM PROMPT FROM CLIENT PROFILE
// ==========================================
const buildSystemPrompt = (profile: any, firstName: string, lastName: string, language: string): string => {
  return `You are an expert AI fitness coach and nutritionist. You are warm, motivating, and supportive.

Your client's name is ${firstName} ${lastName}. Address them by their first name (${firstName}) naturally in conversation.

Your client's profile:
- Age: ${profile.age} years old
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- Fitness Level: ${profile.fitnessLevel}
- Fitness Goal: ${profile.fitnessGoal}
- Workout Days Per Week: ${profile.workoutDaysPerWeek}
- Available Equipment: ${profile.availableEquipment.join(', ') || 'none (bodyweight only)'}
- Dietary Preferences: ${profile.dietaryPreferences.join(', ') || 'none'}
- Allergies: ${profile.allergies.join(', ') || 'none'}
- Cuisine Preference: ${profile.cuisinePreference || 'Ethiopian'}
- Medical Conditions: ${profile.medicalConditions.join(', ') || 'none'}

Guidelines:
- Always address the client as ${firstName}
- Always give advice tailored to THIS specific client's profile above
- When recommending food, always suggest ${profile.cuisinePreference || 'Ethiopian'} dishes when possible
- Be encouraging and motivating, never discouraging
- Keep responses concise and practical (2-4 paragraphs max)
- If asked about medical issues beyond fitness/nutrition, recommend consulting a doctor
- Always remember their goal is ${profile.fitnessGoal}
- CRITICAL: You MUST respond ENTIRELY in ${language} language only. Every single word must be in ${language}. Do NOT mix languages under any circumstances.
 This is non-negotiable.- When responding in Amharic, use simple, clear, everyday Amharic that everyone can understand regardless of education level.`;
};

// ==========================================
// 💬 SEND MESSAGE
// ==========================================
export const sendMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;
    const { message, language } = req.body;
    const responseLanguage = language || 'English';

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    // 1. Get client's profile and user info
    const [profile, user] = await Promise.all([
      prisma.fitnessProfile.findUnique({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      })
    ]);

    if (!profile) {
      return res.status(404).json({
        message: "Please complete your fitness profile first so I can give you personalized advice!"
      });
    }

    // 2. Load last 20 messages from DB for conversation history
    const previousMessages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    // 3. Save the user's message to DB
    await prisma.chatMessage.create({
      data: { userId, role: 'user', content: message }
    });

    // 4. Build conversation history in Gemini format
    const history = previousMessages.map((msg: any) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.content }]
    }));

    // 5. Start Gemini chat session with history + system prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(profile, user?.firstName || '', user?.lastName || '', responseLanguage)
    });

    const chat = model.startChat({ history });

    // 6. Send the new message to Gemini (with auto retry)
    const aiResponse = await generateChatResponse(model, chat, message);

    // 7. Save AI response to DB
    await prisma.chatMessage.create({
      data: { userId, role: 'model', content: aiResponse }
    });

    // 8. Return AI response
    return res.status(200).json({
      message: aiResponse,
      role: 'model'
    });

  } catch (error) {
    console.error("Chat Error: ", error);
    return res.status(500).json({ message: "Failed to get AI response. Please try again." });
  }
};

// ==========================================
// 📋 GET CHAT HISTORY
// ==========================================
export const getChatHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json({ messages });

  } catch (error) {
    console.error("Get Chat History Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ==========================================
// 🗑️ CLEAR CHAT HISTORY
// ==========================================
export const clearChatHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId as string;

    await prisma.chatMessage.deleteMany({
      where: { userId }
    });

    return res.status(200).json({ message: "Chat history cleared successfully! 🗑️" });

  } catch (error) {
    console.error("Clear Chat History Error: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};