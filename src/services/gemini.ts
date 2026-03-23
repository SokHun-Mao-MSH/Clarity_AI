import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GenerationOptions {
  inputCode?: string;
  language: string;
  outputLanguage: string;
  actionType: 'Explain' | 'Debug' | 'Refactor' | 'Generate' | string;
  imageData?: string;
  mimeType?: string;
}

export async function generateAIContent(options: GenerationOptions) {
  const { inputCode, language, outputLanguage, actionType, imageData, mimeType } = options;
  
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

  // Using gemini-3-flash for API Key 3.0 compatibility as per environment requirements.
  const modelId = "gemini-3-flash";
  const model = genAI.getGenerativeModel({ model: modelId });

  const parts: any[] = [
    { text: prompt },
    ...(imageData
      ? [
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType || "image/png",
            },
          },
        ]
      : []),
  ];

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.status === 404) {
      throw new Error("Model not found (404). Please ensure 'gemini-3-flash' is available for your API key.");
    }
    throw new Error(`AI Generation failed: ${error.message || "Unknown error"}`);
  }
}
