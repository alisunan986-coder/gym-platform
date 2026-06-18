import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "Hello, Gym Platform!" in one sentence.');
    console.log('✅ Gemini API Key works!');
    console.log('Response:', result.response.text());
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
  }
}

testGemini();