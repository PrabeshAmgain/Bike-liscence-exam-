
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts questions from the PDF and handles image generation for visual questions.
 */
export const generateQuizQuestionsFromPDF = async (
  pdfBase64?: string
): Promise<Question[]> => {
  try {
    const model = "gemini-3-flash-preview";
    
    // 1. Prepare prompt and parts
    let contents: any = [];
    if (pdfBase64) {
      contents.push({
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf"
        }
      });
      contents.push({
        text: "Extract 25 random multiple-choice questions from this Nepal Driving License question bank PDF. Stictly maintain the original Nepali text for questions and options. If a question in the PDF has an image (like a traffic sign or road scenario), provide a very detailed description of that image in the 'imageDescription' field. Return as a JSON array."
      });
    } else {
      // Fallback to text-based if no PDF
      contents = "Generate 25 multiple-choice questions based on the official Nepal Category A/K driving license bank. If it's a traffic sign question, provide a description of the sign in 'imageDescription'. Return JSON.";
    }

    const response = await ai.models.generateContent({
      model,
      contents,
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
              category: { type: Type.STRING },
              imageDescription: { type: Type.STRING, description: "Detailed description of the image accompanying this question in the PDF, if any." }
            },
            required: ["question", "options", "correctIndex", "category"]
          }
        },
        systemInstruction: "You are an expert OCR and exam creator. You MUST extract text exactly as it appears in the PDF. Do not summarize or alter the meaning. Use the provided PDF context only."
      }
    });

    const text = response.text;
    const rawQuestions = text ? JSON.parse(text) : [];
    
    // 2. Process and generate images where needed
    const finalQuestions: Question[] = [];
    
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const questionObj: Question = {
        ...q,
        id: `q-${Date.now()}-${i}`
      };

      if (q.imageDescription && q.imageDescription.trim().length > 10) {
        // Use gemini-2.5-flash-image to recreate the image
        try {
          const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{
              text: `Generate a clean, high-quality vector-style icon or realistic road scenario for a driving license test based on this description: ${q.imageDescription}. It should look like a professional traffic sign or official exam illustration. No text in the image except standard traffic symbols.`
            }],
            config: {
              imageConfig: { aspectRatio: "1:1" }
            }
          });

          for (const part of imgResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              questionObj.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (imgErr) {
          console.warn("Failed to generate image for question", i, imgErr);
        }
      }
      
      finalQuestions.push(questionObj);
    }

    return finalQuestions;
  } catch (error) {
    console.error("Error in PDF question generation:", error);
    return []; // Return empty or trigger fallback in App
  }
};
