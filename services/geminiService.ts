import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReadingTest, WritingSubmission, Flashcard } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Writing Grading Service ---

export const gradeWritingEssay = async (
  essay: string,
  question: string
): Promise<WritingSubmission['feedback'] & { score: number }> => {
  
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Act as a strict IELTS examiner. Grade the following Task 2 essay based on the question: "${question}".
    
    Provide:
    1. Band scores (0-9) for: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
    2. An overall Band Score.
    3. 3-5 specific bullet points on errors or improvements.
    4. A complete rewrite of the essay that would score a Band 8.5+, improving vocabulary and flow while keeping the original argument.
    
    Student Essay:
    "${essay}"
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      taskResponse: { type: Type.NUMBER },
      coherence: { type: Type.NUMBER },
      lexical: { type: Type.NUMBER },
      grammar: { type: Type.NUMBER },
      overallScore: { type: Type.NUMBER },
      critiquePoints: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      rewrittenEssay: { type: Type.STRING }
    },
    required: ["taskResponse", "coherence", "lexical", "grammar", "overallScore", "critiquePoints", "rewrittenEssay"]
  };

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    }
  });

  const data = JSON.parse(result.text || "{}");

  return {
    score: data.overallScore,
    taskResponse: data.taskResponse,
    coherence: data.coherence,
    lexical: data.lexical,
    grammar: data.grammar,
    critiquePoints: data.critiquePoints,
    rewrittenEssay: data.rewrittenEssay
  };
};

// --- Reading PDF Parsing Service (Admin) ---

export const parseReadingTestPDF = async (pdfBase64: string): Promise<ReadingTest> => {
  const model = "gemini-2.5-flash"; // Supports PDF understanding

  const prompt = `
    Analyze the attached PDF which contains an IELTS Reading Exam.
    Extract 3 distinct reading passages and their associated questions.
    Output a valid JSON object matching the requested schema.
  `;

  // Define schema for strict output
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sectionId: { type: Type.STRING },
            title: { type: Type.STRING },
            passageText: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["MCQ", "TFNG", "FIB"] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING }
                },
                required: ["id", "text", "type", "correctAnswer"]
              }
            }
          },
          required: ["sectionId", "title", "passageText", "questions"]
        }
      }
    },
    required: ["title", "sections"]
  };

  const result = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      },
      {
        text: prompt
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const parsed = JSON.parse(result.text || "{}");
  return {
    ...parsed,
    id: Date.now().toString(), // Generate a temporary ID
  };
};

// --- Reading Explainer Service (Smart Explainer) ---

export const explainReadingAnswer = async (
  questionText: string,
  userAnswer: string,
  correctAnswer: string,
  passageSnippet: string
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Context: IELTS Reading Test.
    Passage Snippet: "...${passageSnippet}..."
    Question: "${questionText}"
    User Answer: "${userAnswer}" (Incorrect)
    Correct Answer: "${correctAnswer}"
    
    Explain clearly in 2-3 sentences why the user's answer is wrong and why the correct answer is right based on the text evidence. Address the user directly ("You chose...").
  `;

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return result.text || "Explanation unavailable.";
};

// --- Flashcard Definition Service ---

export const generateFlashcardDefinition = async (
  word: string,
  sentence: string
): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Define the word "${word}" as it is used in this sentence: "${sentence}".
    Keep the definition concise (under 20 words).
  `;

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return result.text?.trim() || "Definition unavailable.";
};