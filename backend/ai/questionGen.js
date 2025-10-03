import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateQuestions(role = "fullstack developer") {
  try {
    const prompt = `
    Generate exactly 6 interview questions for a ${role} role.
    Format: JSON array.
    Rules:
    - 2 easy MCQs (time: 20s)
    - 2 medium MCQs (time: 60s)
    - 2 hard questions (mix: at least 1 subjective, at most 1 MCQ) (time: 120s)
    - Each question object must have:
      { "id": number, "text": string, "difficulty": "easy|medium|hard",
        "type": "mcq|subjective", "options"?: [string], "answer"?: string, "time": number }
    Only output valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json", // ✅ THIS LINE FIXES THE ERROR
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    const content = response.text;
    const questions = JSON.parse(content);

    return questions.map((q, i) => ({ id: i + 1, ...q }));
  } catch (e) {
    console.error("⚠️ AI question generation failed:", e.message);
    // fallback
    return [
      {
        id: 1,
        text: "What is JSX in React?",
        difficulty: "easy",
        type: "mcq",
        options: ["Template engine", "JS syntax extension", "CSS preprocessor"],
        answer: "JS syntax extension",
        time: 20,
      },
      {
        id: 2,
        text: "Which hook is used for state management?",
        difficulty: "easy",
        type: "mcq",
        options: ["useEffect", "useState", "useRef"],
        answer: "useState",
        time: 20,
      },
      {
        id: 3,
        text: "Which hook replaces lifecycle methods like componentDidMount?",
        difficulty: "medium",
        type: "mcq",
        options: ["useContext", "useEffect", "useMemo"],
        answer: "useEffect",
        time: 60,
      },
      {
        id: 4,
        text: "Which HTTP method is idempotent?",
        difficulty: "medium",
        type: "mcq",
        options: ["POST", "GET", "PATCH"],
        answer: "GET",
        time: 60,
      },
      {
        id: 5,
        text: "Explain JWT authentication flow in a React app.",
        difficulty: "hard",
        type: "subjective",
        time: 120,
      },
      {
        id: 6,
        text: "What is the Event Loop in Node.js?",
        difficulty: "hard",
        type: "mcq",
        options: ["Database system", "Concurrency model", "Compiler feature"],
        answer: "Concurrency model",
        time: 120,
      },
    ];
  }
}
