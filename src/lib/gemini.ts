import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function chatWithGemini(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], base64Data?: string) {
  try {
    const parts: any[] = [{ text: prompt }];

    if (base64Data) {
      const mimeType = base64Data.startsWith('data:application/pdf') ? 'application/pdf' : 'image/png';
      parts.unshift({
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType: mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [...history, { role: 'user', parts: parts }],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, base64Image?: string) {
  try {
    const parts: any[] = [{ text: prompt }];
    
    if (base64Image) {
      parts.unshift({
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: "image/png",
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: parts },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
}
