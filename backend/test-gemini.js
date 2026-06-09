import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const modelsToTest = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro'
];

async function testModels() {
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say 'hello'");
      console.log(`[SUCCESS] ${modelName}:`, await result.response.text());
      return; // Stop on first success
    } catch (err) {
      console.error(`[ERROR] ${modelName}:`, err.message);
    }
  }
}

testModels();
