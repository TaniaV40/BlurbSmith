import express from "express";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function parseMarkdownForGoogleDocs(title: string, markdown: string) {
  const requests: any[] = [];
  let fullText = `${title.toUpperCase()}\nBOOK DESCRIPTION\n\n`;
  
  const styleRanges: { start: number; end: number; bold?: boolean; fontSize?: number }[] = [];
  
  // Title style (18pt bold)
  styleRanges.push({ start: 1, end: 1 + title.length, bold: true, fontSize: 18 });
  
  // Subtitle header style (11pt bold)
  const subStart = 1 + title.length + 1;
  styleRanges.push({ start: subStart, end: subStart + 16, bold: true, fontSize: 11 });

  let currentIndex = fullText.length + 1; // Docs API is 1-indexed

  const lines = markdown.split("\n");

  for (const rawLine of lines) {
    let line = rawLine;

    if (!line.trim()) {
      fullText += "\n";
      currentIndex += 1;
      continue;
    }

    let isHeader = false;

    if (line.startsWith("#")) {
      isHeader = true;
      line = line.replace(/^#+\s*/, "");
    } else if (/^\s*[*|-]\s+/.test(line)) {
      line = line.replace(/^\s*[*|-]\s+/, "• ");
    }

    const lineStart = currentIndex;

    // Parse **bold** tokens
    const boldRegex = /\*\*(.*?)\*\*/g;
    let cleanLine = "";
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    const lineBoldRanges: { start: number; end: number }[] = [];

    while ((match = boldRegex.exec(line)) !== null) {
      cleanLine += line.substring(lastIdx, match.index);
      const boldStart = lineStart + cleanLine.length;
      const boldText = match[1];
      cleanLine += boldText;
      const boldEnd = lineStart + cleanLine.length;
      lineBoldRanges.push({ start: boldStart, end: boldEnd });
      lastIdx = match.index + match[0].length;
    }
    cleanLine += line.substring(lastIdx);
    cleanLine += "\n";

    fullText += cleanLine;
    currentIndex += cleanLine.length;

    if (isHeader) {
      styleRanges.push({
        start: lineStart,
        end: lineStart + cleanLine.length - 1,
        bold: true,
        fontSize: 14,
      });
    } else {
      for (const r of lineBoldRanges) {
        styleRanges.push({ start: r.start, end: r.end, bold: true });
      }
    }
  }

  // 1. Insert Text
  requests.push({
    insertText: {
      location: { index: 1 },
      text: fullText,
    },
  });

  // 2. Format Styles
  for (const style of styleRanges) {
    if (style.start < style.end) {
      const textStyle: any = {};
      const fields: string[] = [];

      if (style.bold !== undefined) {
        textStyle.bold = style.bold;
        fields.push("bold");
      }
      if (style.fontSize !== undefined) {
        textStyle.fontSize = { size: style.fontSize, unit: "PT" };
        fields.push("fontSize");
      }

      if (fields.length > 0) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: style.start,
              endIndex: style.end,
            },
            textStyle,
            fields: fields.join(","),
          },
        });
      }
    }
  }

  return { fullText, requests };
}

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

Do not include any intro/outro conversational text, just the generated blurb.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate blurb" });
  }
});

app.post("/api/export-google-doc", async (req, res) => {
  try {
    const token = req.body.userAccessToken || req.body.accessToken;
    const title = req.body.title;
    const blurbContent = req.body.blurbContent || req.body.content;

    if (!token || !title || !blurbContent) {
      return res.status(400).json({ error: "Missing required parameters: token, title, or blurbContent" });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });

    // 1. Create a blank Google Doc file
    const fileMetaData = {
      name: `Book Blurb - ${title}`,
      mimeType: "application/vnd.google-apps.document",
    };

    const file = await drive.files.create({
      requestBody: fileMetaData,
      fields: "id, webViewLink",
    });

    const documentId = file.data.id;
    if (!documentId) {
      throw new Error("Failed to retrieve created document ID from Google Drive");
    }

    // 2. Parse Markdown and format Google Doc
    const { requests } = parseMarkdownForGoogleDocs(title, blurbContent);

    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests,
      },
    });

    res.json({
      docId: documentId,
      docUrl: file.data.webViewLink,
    });
  } catch (error: any) {
    console.error("Google Doc Export Error:", error);
    res.status(500).json({ error: error.message || "Failed to export Google Doc" });
  }
});

export default app;
