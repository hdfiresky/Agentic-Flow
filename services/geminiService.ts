
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { GroundingChunk } from "../types";

let ai: GoogleGenAI | null = null;

const initializeAi = () => {
  if (ai) return;
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY environment variable is not set. Gemini API calls will fail.");
    return;
  }
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null;
  }
};

initializeAi();

export const processAgentTask = async (
  agentDescription: string,
  input: string,
  enableInternetSearch?: boolean
): Promise<{ text: string; groundingMetadata?: GroundingChunk[] }> => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if(!apiKey) {
        return Promise.reject(new Error("Gemini API Key is not configured. Please set the API_KEY environment variable."));
    }
    initializeAi();
    if(!ai) {
        return Promise.reject(new Error("Gemini AI service could not be initialized. Check API Key and network."));
    }
  }

  try {
    const systemInstruction = `You are an AI agent. Your defined role/task is: "${agentDescription}". Process the given input according to this role and provide a concise output.`;
    const userPrompt = `Input to process: "${input}"`;

    const modelConfig: GenerateContentParameters['config'] = {
      systemInstruction: systemInstruction,
    };

    if (enableInternetSearch) {
      modelConfig.tools = [{googleSearch: {}}];
      // IMPORTANT: Do NOT set responseMimeType: "application/json" when using googleSearch tool.
    }
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: userPrompt,
      config: modelConfig,
    });

    const text = response.text;
    let groundingMetadata: GroundingChunk[] | undefined = undefined;

    if (enableInternetSearch && response.candidates && response.candidates[0]?.groundingMetadata?.groundingChunks) {
        groundingMetadata = response.candidates[0].groundingMetadata.groundingChunks as GroundingChunk[];
    }

    return { text, groundingMetadata: groundingMetadata || [] };

  } catch (error) {
    console.error("Error processing agent task with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred with Gemini API.");
  }
};
