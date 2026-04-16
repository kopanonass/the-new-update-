import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.includes('TODO')) {
    return null;
  }
  return key;
};

const ai = new GoogleGenAI({ 
  apiKey: getApiKey() || 'MISSING_KEY' 
});

export async function chatWithGemini(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], base64Data?: string) {
  if (!getApiKey()) {
    throw new Error("API_KEY_MISSING");
  }
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        systemInstruction: "You are Orbit Collage Student AI, powered by NanoBanana Pro. If the user asks to create, draw, or generate an image, do NOT respond with JSON or tool calls. Instead, simply describe the image you are about to create. The system will handle the actual generation."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, base64Image?: string) {
  if (!getApiKey()) {
    throw new Error("API_KEY_MISSING");
  }
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
      model: "gemini-3-pro-image-preview",
      contents: [{ role: 'user', parts: parts }],
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "1:1"
        }
      }
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
