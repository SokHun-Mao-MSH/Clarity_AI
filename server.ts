import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allow cross-origin requests
  app.use(cors({ origin: true }));
  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Code Clarity Backend is running" });
  });

  app.post("/api/explain", async (req, res) => {
    try {
      const { inputCode, language, outputLanguage, actionType, imageData, mimeType } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing from environment variables");
        return res.status(500).json({ error: "API Key configuration error" });
      }

      if (!inputCode && !imageData) {
        return res.status(400).json({ error: "Input code or image is required" });
      }

      const prompt = `You are a professional AI code assistant. Your goal is to provide 100% accurate and reliable answers.
Drive straight into the content without ANY introductory filler.

Guidelines:
1. NO INTRO: ABSOLUTELY NO introductory phrases in ANY language. You MUST NOT say "You are using...", "Here is...", or "អ្នកកំពុងប្រើ៖ របៀប...". Start your response IMMEDIATELY with the first step of analysis or the code block. ZERO text before the core content.
2. Language: Provide the response exclusively in ${outputLanguage}.
   - If the language is Khmer: Use correct grammar and natural wording. Keep the response balanced (not too short, not too long), clear, and detailed.
3. Processing Rules for ${actionType}:
   - Explain: Provide step-by-step guidance. Make it simple and beginner-friendly. Use clear examples.
   - Debug: Clearly explain the cause of the error. Show how to fix it. When providing the fixed code, use the header "កូដដែលបានកែតម្រូវ (Corrected Code):" and then the code block.
   - Refactor: Rewrite code in a clean, professional, and maintainable way following best practices.
4. Vision: If an image is provided, analyze it for visible code, error messages, or UI issues. Combine this with any provided code to give a complete solution.
5. Code Review: Analyze the provided code/image carefully. Identify any errors or bad practices. Even in "Explain" mode, if there are mistakes, point them out and explain why, then suggest improvements.
6. Formatting: ALWAYS wrap any code snippets in triple backticks with the language specified (e.g. \`\`\`javascript). Do not write code like a sentence. Use clear, separate blocks.

CRITICAL: START YOUR RESPONSE DIRECTLY WITH THE CONTENT. DO NOT INCLUDE ANY HEADER OR INTRODUCTION.

Code to process:
\`\`\`${language}
${inputCode || "No code provided, please analyze the image contents if available."}
\`\`\``;

      // Using 'gemini-1.5-pro' for maximum stability across all regions and API keys.
      // (Note: This is the most reliable model for multimodal code analysis)
      const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });

      const parts: any[] = [
        { text: prompt },
        ...(imageData ? [{ inlineData: { data: imageData, mimeType: mimeType || "image/png" } }] : [])
      ];

      const result = await model.generateContent({
        contents: [{ role: "user", parts }]
      });

      const response = await result.response;
      const text = response.text();

      res.json({ result: text });
    } catch (error) {
      console.error("Failed to call AI API:", error);
      res.status(500).json({ error: "An error occurred while describing the code" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.get('/', (req, res) => {
      res.send('Code Clarity API Backend is running.');
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
