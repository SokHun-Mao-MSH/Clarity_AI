import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function checkServer() {
  console.log("--- SYSTEM DIAGNOSTIC START ---");
  console.log(`TIME: ${new Date().toLocaleString()}`);
  console.log(`API KEY: ${process.env.GEMINI_API_KEY ? "PRESENT (Starts with " + process.env.GEMINI_API_KEY.slice(0, 7) + "...)" : "MISSING"}`);
  
  try {
    // Attempting to list models using the correct SDK method
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 
    console.log("CHECKING CONNECTIVITY...");
    const result = await models.generateContent("Say 'HEALTH_CHECK_OK'");
    console.log(`TEST RESPONSE: ${result.response.text()}`);
    
    console.log("SUCCESS: Server can reach Gemini API!");
  } catch (error: any) {
    console.error("DIAGNOSTIC_ERROR:", error.message || error);
    if (error.status === 404) {
      console.log("TIP: The current model ID might be blocked in your region or account.");
    }
  }
  console.log("--- SYSTEM DIAGNOSTIC END ---");
}

checkServer();
