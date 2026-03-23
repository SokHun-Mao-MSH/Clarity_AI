import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function main() {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];
  
  for (const m of models) {
    try {
      console.log(`TESTING MODEL: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("hi");
      console.log(`SUCCESS [${m}]: ${result.response.text().slice(0, 10)}...`);
      break; 
    } catch (e: any) {
      console.log(`FAILED [${m}]: ${e.message}`);
    }
  }
}

main();
