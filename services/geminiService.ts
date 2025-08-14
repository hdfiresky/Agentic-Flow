
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { GroundingChunk } from "../types";

// A singleton instance of the GoogleGenAI client.
let ai: GoogleGenAI | null = null;

/**
 * @what Initializes and returns the GoogleGenAI instance.
 * @why To ensure the Gemini API client is a singleton and only initialized once. This is more efficient
 * and avoids re-creating the client for every API call.
 * @how It checks if an instance `ai` already exists. If not, it retrieves the API key
 * from `process.env.API_KEY` and creates a new `GoogleGenAI` instance.
 * It throws an error if the API key is missing, preventing the app from making failed API calls.
 * @returns {GoogleGenAI} The initialized GoogleGenAI instance.
 * @throws {Error} If the API_KEY environment variable is not set.
 */
const getAi = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      const errorMsg = "Gemini API Key is not configured. Please set the API_KEY environment variable.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      ai = new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      throw new Error("Gemini AI service could not be initialized. Check API Key and network.");
    }
  }
  return ai;
};


/**
 * @what Processes a given task by an AI agent using the Gemini API.
 * @why This is the core function for communicating with the AI model. It encapsulates the logic for
 * constructing the prompt, handling optional internet search, and parsing the response.
 * @how It takes an agent's role description and an input string. It constructs a system instruction
 * to define the agent's persona and a user prompt with the specific input. If internet search is enabled,
 * it adds the `googleSearch` tool to the request configuration. It then calls the Gemini API's `generateContent` method.
 * Finally, it extracts the text response and any grounding metadata (web sources) from the result.
 * @param {string} agentDescription - The role or task definition for the AI agent (e.g., "Summarize the following text.").
 * @param {string} input - The input data or question for the agent to process.
 * @param {boolean} [enableInternetSearch=false] - If true, enables Google Search for grounding, providing the model with web access.
 * @returns {Promise<{ text: string; groundingMetadata?: GroundingChunk[] }>} A promise that resolves to an object
 * containing the AI's text response and an array of grounding metadata sources, if available.
 * @throws {Error} If the API call fails or an error occurs during processing.
 */
export const processAgentTask = async (
  agentDescription: string,
  input: string,
  enableInternetSearch?: boolean
): Promise<{ text: string; groundingMetadata?: GroundingChunk[] }> => {
  try {
    const aiInstance = getAi();
    
    // The system instruction sets the context and role for the AI agent.
    const systemInstruction = `You are an AI agent. Your defined role/task is: "${agentDescription}". Process the given input according to this role and provide a concise output.`;
    // The user prompt contains the specific data the agent needs to work on.
    const userPrompt = `Input to process: "${input}"`;

    const modelConfig: GenerateContentParameters['config'] = {
      systemInstruction: systemInstruction,
    };

    // If internet search is enabled, add the googleSearch tool to the configuration.
    // This allows the model to ground its response with up-to-date information from the web.
    if (enableInternetSearch) {
      modelConfig.tools = [{googleSearch: {}}];
      // IMPORTANT: Per Gemini API guidelines, do NOT set responseMimeType when using the googleSearch tool.
    }
    
    const response: GenerateContentResponse = await aiInstance.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: userPrompt,
      config: modelConfig,
    });

    const text = response.text;
    let groundingMetadata: GroundingChunk[] | undefined = undefined;

    // Extract grounding metadata if the search tool was used and returned sources.
    if (enableInternetSearch && response.candidates && response.candidates[0]?.groundingMetadata?.groundingChunks) {
        groundingMetadata = response.candidates[0].groundingMetadata.groundingChunks as GroundingChunk[];
    }

    return { text, groundingMetadata: groundingMetadata || [] };

  } catch (error) {
    console.error("Error processing agent task with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred with the Gemini API.");
  }
};
