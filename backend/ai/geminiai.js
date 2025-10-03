import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function scoreSubjective(question, answer) {
  try {
    const prompt = `
    You are an interviewer. 
    Question: ${question}
    Candidate's answer: ${answer}
    Score this answer from 0–10 and explain briefly why.
    Respond strictly in JSON:
    { "score": number, "rationale": string }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 300,
        temperature: 0,
      },
    });

    const content = response.text;
    return JSON.parse(content);
  } catch (e) {
    console.error("AI scoring failed:", e.message);
    return { score: 5, rationale: "Default fallback score." };
  }
}

export async function generateSummary(questions, answers, finalScore) {
  try {
    const qaText = questions
      .map((q, i) => {
        const ans = answers.find((a) => a.questionId === q.id);
        return `Q${i + 1}: ${q.text}\nAnswer: ${ans?.answer || "No answer"}`;
      })
      .join("\n\n");

    const prompt = `
    You are an interviewer. Based on this interview performance:
    
    ${qaText}
    
    Final Score: ${finalScore}%
    
    Write a brief 2-3 sentence summary of the candidate's performance, highlighting strengths and areas for improvement.
    Respond in plain text (not JSON).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (e) {
    console.error("AI summary generation failed:", e.message);
    return "Summary generation failed. Candidate completed the interview.";
  }
}
