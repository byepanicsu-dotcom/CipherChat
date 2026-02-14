import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";
import { Attachment } from "../types";

let chatSession: Chat | null = null;
let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const initializeChat = () => {
  const ai = getClient();
  chatSession = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.8,
    },
  });
};

export const sendMessageStream = async function* (message: string, attachments: Attachment[] = []) {
  if (!chatSession) {
    initializeChat();
  }
  
  if (!chatSession) {
      throw new Error("Failed to initialize chat session");
  }

  try {
    let messageContent: string | Part[] = message;

    // processing attachments
    if (attachments && attachments.length > 0) {
        const parts: Part[] = [];
        
        // Add text if present
        if (message) {
            parts.push({ text: message });
        }

        // Add images/files content
        attachments.forEach(att => {
            if (att.type === 'image' && att.data && att.mimeType) {
                parts.push({
                    inlineData: {
                        mimeType: att.mimeType,
                        data: att.data
                    }
                });
            } else if (att.type === 'video') {
                parts.push({ text: `[User sent a video file]` });
            } else if (att.type === 'file') {
                parts.push({ text: `[User sent a file: ${att.fileName} (${att.fileSize})]` });
            }
        });
        messageContent = parts;
    }

    const responseStream = await chatSession.sendMessageStream({ message: messageContent });
    
    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield " [Connection Error: Secure handshake failed. Please try again.]";
  }
};

export const analyzePrivacyQuestion = async (question: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `The user is asking for a privacy recommendation: "${question}". Provide a short, punchy recommendation for a privacy tool (like Signal, Session, etc) or a privacy tip. Keep it under 50 words.`,
        });
        return response.text || "Could not retrieve privacy data.";
    } catch (e) {
        return "Network error accessing privacy database.";
    }
}