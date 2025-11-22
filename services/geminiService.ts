
import { GoogleGenAI, Type } from "@google/genai";
import { GameData } from "../types";
import { getRandomLocalWord, WORD_BANK } from "./wordBank";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateGameTopic = async (targetCategory: string): Promise<GameData> => {
  
  // 1. Handle Local Random
  if (targetCategory === "LOCAL_RANDOM") {
    return getRandomLocalWord();
  }

  // 2. Handle Specific Local Category
  if (WORD_BANK[targetCategory]) {
    return getRandomLocalWord(targetCategory);
  }

  // 3. Handle AI (Random or Custom)
  const client = getClient();
  
  // Fallback if no API key is present but AI was requested
  if (!client) {
    console.warn("No API Key found for AI request, falling back to local random.");
    return getRandomLocalWord();
  }

  try {
    let prompt = "Generate a random secret word for a game of Imposter (Spyfall). The word should be a common object, place, or profession that everyone knows. Provide a broader category for it.";
    
    // If targetCategory is not empty (and not one of the reserved local keys handled above), it's a custom AI prompt
    if (targetCategory && targetCategory.trim() !== "") {
      prompt = `Generate a secret word specifically for the category: "${targetCategory}". The word should be a common object, place, or concept within this category that most people know.`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The broad category.",
            },
            word: {
              type: Type.STRING,
              description: "The specific secret word.",
            },
          },
          required: ["category", "word"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const data = JSON.parse(text) as GameData;
    
    // Capitalize for display consistency
    data.category = data.category.charAt(0).toUpperCase() + data.category.slice(1);
    data.word = data.word.charAt(0).toUpperCase() + data.word.slice(1);
    
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Graceful fallback to local data
    return getRandomLocalWord();
  }
};
