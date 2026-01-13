import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client with API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateSecureResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model', text: string }[] = []
): Promise<string> => {
  try {
    // Construct history for context if needed, though for simple one-off query we can just use the prompt
    // For a better chat experience, we could use the chat API, but generateContent works well for this demo.
    
    // Simple system instruction for the "Secure" persona
    const systemInstruction = "You are a highly secure, confidential AI assistant residing within the JackRyanAI portal. Your responses should be professional, concise, and helpful. You prioritize data privacy and security in your tone.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Encrypted connection interrupted. Please try again.";
  }
};