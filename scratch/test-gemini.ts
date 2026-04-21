
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, are you there?");
    console.log("Response:", result.response.text());
  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    if (error.response) {
      console.error("Status:", error.status);
      console.error("Data:", JSON.stringify(error.response, null, 2));
    }
  }
}

testGemini();
