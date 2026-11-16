import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function formatApiError(error: any, fallbackMessage: string): { status: number; message: string } {
  const rawMessage = typeof error?.message === "string" ? error.message.trim() : "";
  if (rawMessage.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawMessage);
      const apiErr = parsed?.error || parsed;
      const code = typeof apiErr?.code === "number" ? apiErr.code : 500;
      const msg = apiErr?.message || fallbackMessage;
      if (code === 403) {
        return {
          status: 403,
          message: `Gemini API permission denied (${msg}). Please verify GEMINI_API_KEY in your environment settings and ensure the Generative Language API is enabled.`,
        };
      }
      return { status: code >= 400 && code < 600 ? code : 500, message: msg };
    } catch {
      // Fall through if not valid JSON
    }
  }
  return { status: 500, message: rawMessage || fallbackMessage };
}

function stripEmDashes(text: string): string {
  return text
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/([^\n-])\s*--\s*([^\n-])/g, "$1, $2")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.!?])/g, "$1");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/generate", async (req, res) => {
    try {
      const { title, premise, reference } = req.body;
      
      if (!title || !premise || !reference) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const prompt = `You are an expert Amazon book description copywriter. 
Your task is to write a high-converting, punchy, and structurally sound book description for a new book.

Book Title: "${title}"
Story/Premise Details: "${premise}"

Reference Best-Seller Blurb (Match the tone, pacing, and structure of this):
"${reference}"

Instructions:
1. Analyze the reference blurb's structure (hooks, heading usage, bullet points, CTA) and tone.
2. Apply that exact structure to write an original blurb for the provided story/premise.
3. Make sure to include a punchy lead hook, structured bold headings (if the reference uses them), bullet points for key selling points (if appropriate based on the reference), and a strong final Call-To-Action (CTA) encouraging the reader to buy/read.
4. Output the result in Markdown format.
5. STRICT PUNCTUATION RULE: NEVER use em-dashes (—), en-dashes (–), or double-hyphens (--) anywhere in the blurb, even if the reference blurb contains them. Use commas, periods, colons, or separate sentences instead.

Do not include any intro/outro conversational text, just the generated blurb.`;

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        return res.status(500).json({
          error: "Server configuration error: GEMINI_API_KEY is not set in the environment variables.",
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const cleanedText = stripEmDashes(response.text || "");
      res.json({ text: cleanedText });
    } catch (error: any) {
      console.error("Generation error:", error);
      const { status, message } = formatApiError(error, "Failed to generate blurb");
      res.status(status).json({ error: message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
