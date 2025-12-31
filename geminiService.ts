
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "./types";

// Always use the process.env.API_KEY directly as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This is a partial extraction of the OCR knowledge base provided by the user
// to help the model generate accurate questions.
const KNOWLEDGE_BASE_CONTEXT = `
Official Question Bank for Category A (Motorcycle) and K (Scooter/Moped) Driving License - Nepal 2078.
Categories:
1. Vehicle Operation (सवारी सञ्चालन सम्बन्धी ज्ञान)
2. Traffic Rules & Laws (सवारी ऐन नियमसम्बन्धी ज्ञान)
3. Technical & Mechanical (सवारी साधनको प्राविधिक तथा यान्त्रिक ज्ञान)
4. Environment Pollution (वातावरण प्रदूषण सम्बन्धी अवधारणात्मक ज्ञान)
5. Accident Awareness (दुर्घटना सचेतना सम्बन्धी ज्ञान)
6. Traffic Signs (ट्राफिक सङ्केत सम्बन्धी ज्ञान)

Examples from pool:
- Zebra crossing is for: Pedestrians to cross the road (पैदल यात्रीले बाटो काट्न).
- Steep climb gear: 1st gear (एक नम्बर गियरमा).
- Overtaking side: Right side (दायाँ साइडबाट).
- Driving after drinking: Prohibited (मदक पदार्थ सेवन गरेर चलाउनु हुँदैन).
- Embossed Number Plate: Letter/numbers raised (प्लेटमा उठाएर अक्षर र अंक लेखेको).
- Traffic light sequence: Green, Yellow, Red.
`;

export const generateQuizQuestions = async (): Promise<Question[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 25 multiple-choice questions for the Nepal Driving License (Category A/K) written exam based on the provided knowledge base context. 
      The questions must be in Nepali. 
      Ensure a mix of categories:
      - 5 from Vehicle Operation
      - 4 from Rules & Laws
      - 3 from Technical/Mechanical
      - 1 from Environment
      - 2 from Accident Awareness
      - 10 from Traffic Signs (describe the sign visually since text-only).
      
      Return as a JSON array of objects with fields: question, options (4 strings), correctIndex (0-3), and category.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              category: { type: Type.STRING }
            },
            required: ["question", "options", "correctIndex", "category"]
          }
        },
        systemInstruction: `You are an expert in the Nepal Ministry of Physical Infrastructure and Transport question bank.
        Use the following context to ensure accuracy: ${KNOWLEDGE_BASE_CONTEXT}.
        All output MUST be in Nepali language where appropriate for questions and options.`
      }
    });

    // Access the text property directly from the response.
    const text = response.text;
    const questionsData = text ? JSON.parse(text) : [];
    
    return questionsData.map((q: any, index: number) => ({
      ...q,
      id: `q-${index}`
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    // Fallback static questions if API fails or rate limits
    return FALLBACK_QUESTIONS;
  }
};

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: "f1",
    question: "जेब्रा क्रसिङ के का लागि प्रयोग गरिन्छ ?",
    options: ["उभिन", "पैदल यात्रीले बाटो काट्न", "गाडी रोक्न", "गाडी कुदाउन"],
    correctIndex: 1,
    category: "सवारी सञ्चालन"
  },
  {
    id: "f2",
    question: "बढी उकालोमा सवारी चलाउँदा कुन गियरमा चलाउनुपर्दछ ?",
    options: ["एक गियरमा", "दुई गियरमा", "तीन गियरमा", "चार गियरमा"],
    correctIndex: 0,
    category: "सवारी सञ्चालन"
  },
  {
    id: "f3",
    question: "ओभरटेक गर्दा कुन साइडबाट गर्नुपर्छ ?",
    options: ["बायाँ साइडबाट", "दायाँ साइडबाट", "दुबै साइडबाट", "माथिका सबै"],
    correctIndex: 1,
    category: "सवारी सञ्चालन"
  },
  {
    id: "f4",
    question: "निम्नमध्ये सवारी चालकको कर्तव्य कुन हो?",
    options: ["हिफाजतका साथ सवारी चलाउने", "ट्राफिक नियम पालन गर्ने", "निषेधित कार्य नगर्ने", "माथिका सबै"],
    correctIndex: 3,
    category: "सवारी सञ्चालन"
  }
];
