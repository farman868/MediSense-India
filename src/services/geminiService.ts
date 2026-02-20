import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DiagnosisResult {
  conditions: {
    name: string;
    likelihood: number; // 0-100
    description: string;
    commonSymptoms: string[];
  }[];
  triage: "SELF_CARE" | "SEE_DOCTOR" | "EMERGENCY";
  triageReason: string;
  disclaimer: string;
}

export async function getDiagnosis(
  symptoms: string,
  age: number,
  sex: string
): Promise<DiagnosisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Act as a professional medical triage assistant specialized in the Indian health context. 
    User Profile: Age ${age}, Sex ${sex}.
    Reported Symptoms: ${symptoms}
    
    Analyze the symptoms and provide:
    1. Top 3 potential conditions (with likelihood percentage, brief description, and common symptoms). 
       Consider conditions common in India (e.g., tropical diseases like Dengue, Malaria, Typhoid, or regional health issues) if relevant to the symptoms.
    2. A triage recommendation: 'SELF_CARE', 'SEE_DOCTOR', or 'EMERGENCY'.
    3. A clear reason for the triage level.
    
    IMPORTANT: Include a mandatory medical disclaimer stating this is not a diagnosis and to consult a professional.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conditions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                likelihood: { type: Type.NUMBER },
                description: { type: Type.STRING },
                commonSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["name", "likelihood", "description", "commonSymptoms"],
            },
          },
          triage: { 
            type: Type.STRING, 
            description: "One of: SELF_CARE, SEE_DOCTOR, EMERGENCY" 
          },
          triageReason: { type: Type.STRING },
          disclaimer: { type: Type.STRING },
        },
        required: ["conditions", "triage", "triageReason", "disclaimer"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export interface Hospital {
  name: string;
  uri: string;
  phone?: string;
}

export async function findNearbyHospitals(
  lat: number,
  lng: number
): Promise<Hospital[]> {
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: "Find the nearest hospitals or medical centers to my current location. For each hospital, provide its name and contact phone number in the text response.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    },
  });

  const hospitals: Hospital[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const text = response.text || "";
  
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.maps) {
        const name = chunk.maps.title || "Medical Center";
        
        // Try to find a phone number in the text that follows this hospital name
        // This is a simple heuristic: look for patterns like +91, 0xx, etc. near the name
        const phoneRegex = /(\+?\d{1,4}[\s-]?\d{10}|\d{3,5}[\s-]?\d{6,8})/g;
        const nameEscaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`${nameEscaped}.*?(\\+?\\d[\\d\\s-]{7,15})`, 'i');
        const match = text.match(searchRegex);
        
        hospitals.push({
          name,
          uri: chunk.maps.uri,
          phone: match ? match[1].trim() : undefined
        });
      }
    }
  }

  return hospitals;
}
