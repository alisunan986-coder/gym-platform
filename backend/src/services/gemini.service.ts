import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// ==========================================
// 🧠 CORE FUNCTION — Ask Gemini, get clean JSON back
// ==========================================
export const generateJSON = async (prompt: string): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    //console.log('🔍 RAW GEMINI RESPONSE:', text);

    // Gemini sometimes wraps JSON in markdown code blocks like ```json ... ```
    // We strip that out before parsing
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);

  } catch (error) {
    console.error('Gemini Service Error:', error);
    throw new Error('Failed to generate AI response. Please try again.');
  }
};

// ==========================================
// 💪 WORKOUT PLAN PROMPT BUILDER
// ==========================================
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

// ==========================================
// 🥗 MEAL PLAN PROMPT BUILDER
// ==========================================
export const buildMealPlanPrompt = (profile: any): string => {
  return `
You are a certified nutritionist specializing in ${profile.cuisinePreference || 'Ethiopian'} cuisine. Generate a personalized daily meal plan based on this client profile:

- Weight: ${profile.weight} kg
- Height: ${profile.height} cm
- Fitness Goal: ${profile.fitnessGoal}
- Dietary Preferences: ${profile.dietaryPreferences.join(', ') || 'none'}
- Allergies: ${profile.allergies.join(', ') || 'none'}
- Cuisine Preference: ${profile.cuisinePreference || 'Ethiopian'}

IMPORTANT: All meals MUST be authentic ${profile.cuisinePreference || 'Ethiopian'} dishes (e.g. injera, shiro, doro wat, tibs, kinche, fir-fir, atkilt, misir wat, etc. if Ethiopian). Use real dish names familiar to people from that culture, not generic Western food.

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

Make sure the meal plan respects all dietary preferences and avoids all listed allergies completely, while staying authentic to ${profile.cuisinePreference || 'Ethiopian'} cuisine.
`;
};