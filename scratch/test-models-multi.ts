
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testModel(modelName: string) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, are you there?");
    console.log(`✅ ${modelName} works: ${result.response.text().substring(0, 50).replace(/\n/g, ' ')}...`);
    return true;
  } catch (error: any) {
    console.log(`❌ ${modelName} failed: ${error.message}`);
    return false;
  }
}

async function run() {
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-2.5-flash-lite"
  ];

  for (const m of models) {
    await testModel(m);
  }
}

run();
