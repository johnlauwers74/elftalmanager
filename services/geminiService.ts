
import { GoogleGenAI, Type } from "@google/genai";

// Exercise generation service using Gemini 3
export const generateExerciseSuggestions = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genereer een professionele voetbaltraining oefening voor het thema: "${topic}". 
      Geef de output in het Nederlands in JSON formaat met de volgende velden: 
      title, type, agegroup, playerscount, shortdescription, detailedinstructions, tags (array van strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            agegroup: { type: Type.STRING },
            playerscount: { type: Type.STRING },
            shortdescription: { type: Type.STRING },
            detailedinstructions: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          propertyOrdering: ["title", "type", "agegroup", "playerscount", "shortdescription", "detailedinstructions", "tags"]
        }
      }
    });
    
    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
