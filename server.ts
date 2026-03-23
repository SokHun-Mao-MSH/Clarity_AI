import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initializing the SDK at start-up with a safety check
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
      const {
        inputCode,
        language,
        outputLanguage,
        actionType,
        imageData,
        mimeType,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing from environment variables");
        return res.status(500).json({ error: "API Key configuration error" });
      }

      if (!inputCode && !imageData) {
        return res
          .status(400)
          .json({ error: "Input code or image is required" });
      }

      // Use the consolidated service
      const { generateAIContent } = await import("./src/services/gemini");
      const text = await generateAIContent({
        inputCode,
        language,
        outputLanguage,
        actionType,
        imageData,
        mimeType
      });

      res.json({ result: text });
    } catch (error: any) {
      console.error("Failed to call AI API:", error.message);
      
      if (error.status === 404) {
        console.error(`- ERROR: The model was not found.`);
      }

      res
        .status(500)
        .json({ error: "An error occurred while describing the code" });
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
    app.get("/", (req, res) => {
      res.send("Code Clarity API Backend is running.");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
