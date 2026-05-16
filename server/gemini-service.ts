import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in server environment. Please check Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
};

export async function chatWithGemini(
  prompt: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], 
  base64Data?: string,
  options: { model?: string } = {}
) {
  try {
    const ai = getAiClient();
    const parts: any[] = [{ text: prompt }];

    if (base64Data) {
      // Detect mime type from base64 string
      let mimeType = 'image/png';
      if (base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:([^;]+);base64,/);
        if (match) {
          mimeType = match[1];
        }
      }

      parts.push({
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType: mimeType,
        },
      });
    }

    const modelName = options.model || "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [...history, { role: 'user', parts: parts }],
      config: {
        systemInstruction: "You are Orbit College Student AI, powered by NanoBanana Pro. You assist students with their academic needs. You are professional, helpful, and concise."
      }
    });
    
    // Check for image content (Nano Banana Pro mode)
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return {
        text: response.text,
        image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      };
    }

    return { text: response.text };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, base64Image?: string) {
  // Imaging is actually handled by different models or tools usually.
  // For now, let's keep it as a placeholder or use Imagen if available via API.
  // Since the original code used gemini-3.1-flash-image-preview (hallucination),
  // we'll use a descriptive prompt and return it to the user that we are simulating for now
  // OR we can use the same model to describe how it would edit it.
  
  // Actually, I'll just keep the structure if they want to keep the UI for it.
  return null; 
}
