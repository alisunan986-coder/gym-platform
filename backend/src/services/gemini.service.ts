import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// ==========================================
// 🔄 RETRY HELPER — retries on 503 errors
// ==========================================
const retryWithBackoff = async (
  fn: () => Promise<any>,
  retries: number = 3,
  delayMs: number = 2000
): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is503 = error?.status === 503 || error?.message?.includes('503');
      const isLastAttempt = attempt === retries;

      if (is503 && !isLastAttempt) {
        console.log(`⚠️ Gemini 503 error - retrying in ${delayMs}ms (attempt ${attempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff: 2s → 4s → 8s
      } else {
        throw error; // not a 503, or out of retries
      }
    }
  }
};

// ==========================================
// 🧠 CORE FUNCTION — Ask Gemini, get clean JSON back
// ==========================================
export const generateJSON = async (prompt: string): Promise<any> => {
  return retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // console.log('🔍 RAW GEMINI RESPONSE:', text);

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  });
};

// ==========================================
// 💬 CHAT FUNCTION — used by chatbot
// ==========================================
export const generateChatResponse = async (
  model: any,
  chat: any,
  message: string
): Promise<string> => {
  return retryWithBackoff(async () => {
    const result = await chat.sendMessage(message);
    return result.response.text();
  });
};

// rest of your existing prompt builders stay the same...
export const buildWorkoutPrompt = (profile: any): string => {
  return `
You are a certified personal trainer. Generate a personalized weekly workout plan based on this client profile:

- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- Fitness Level: ${profile.fitnessLevel}
- Fitness Goal: ${profile.fitnessGoal}
- Workout Days Per Week: ${profile.workoutDaysPerWeek}
- Available Equipment: ${profile.availableEquipment.join(', ') || 'none (bodyweight only)'}

Respond with ONLY valid JSON, no markdown, no explanations, no extra text. Use exactly this structure:

{
  "title": "string - a catchy plan title",
  "description": "string - 1-2 sentence overview",
  "weeklySchedule": [
    {
      "day": "Monday",
      "focus": "string - e.g. Upper Body",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string - e.g. '8-12' or '30 seconds'",
          "restSeconds": number
        }
      ]
    }
  ]
}

Generate exactly ${profile.workoutDaysPerWeek} workout days, spread evenly across the week, with rest days in between where appropriate. Each workout day should have 4-6 exercises.
`;
};

export const buildMealPlanPrompt = (profile: any): string => {
  return `
You are a certified nutritionist specializing in ${profile.cuisinePreference || 'Ethiopian'} cuisine. Generate a personalized daily meal plan based on this client profile:

- Weight: ${profile.weight} kg
- Height: ${profile.height} cm
- Fitness Goal: ${profile.fitnessGoal}
- Dietary Preferences: ${profile.dietaryPreferences.join(', ') || 'none'}
- Allergies: ${profile.allergies.join(', ') || 'none'}
- Cuisine Preference: ${profile.cuisinePreference || 'Ethiopian'}

IMPORTANT: All meals MUST be authentic ${profile.cuisinePreference || 'Ethiopian'} dishes. Use real dish names familiar to people from that culture.

Respond with ONLY valid JSON, no markdown, no explanations, no extra text. Use exactly this structure:

{
  "title": "string - a catchy plan title",
  "dailyCalories": number,
  "proteinGrams": number,
  "meals": {
    "breakfast": { "name": "string", "calories": number, "description": "string" },
    "lunch": { "name": "string", "calories": number, "description": "string" },
    "dinner": { "name": "string", "calories": number, "description": "string" },
    "snacks": [
      { "name": "string", "calories": number, "description": "string" }
    ]
  }
}

Make sure the meal plan respects all dietary preferences and avoids all listed allergies completely.
`;
};