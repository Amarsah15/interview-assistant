import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import {
  parsePDF,
  parseDOCX,
  extractEmail,
  extractPhone,
  extractName,
} from "./utils/parseResume.js";
import { scoreSubjective, generateSummary } from "./ai/geminiai.js";
import { generateQuestions } from "./ai/questionGen.js";

dotenv.config();
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const PORT = process.env.PORT || 5000;
const STORE = { candidates: {} };

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Resume parsing
app.post("/api/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
        success: false,
      });
    }

    let text = "";

    try {
      if (file.mimetype === "application/pdf") {
        text = await parsePDF(file.buffer);
      } else if (
        file.originalname.endsWith(".docx") ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await parseDOCX(file.buffer);
      } else {
        return res.status(400).json({
          message: "Unsupported file format",
          success: false,
        });
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.status(500).json({
        message: "Failed to parse resume",
        success: false,
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message: "Could not extract text from resume",
        success: false,
      });
    }

    // Extract information
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const name = extractName(text);

    res.json({
      name: name || "",
      email: email || "",
      phone: phone || "",
      success: true,
    });
  } catch (e) {
    console.error("Upload error:", e);
    res.status(500).json({
      message: "Server error: " + e.message,
      success: false,
    });
  }
});

// AI Question generation
app.post("/api/generate-questions", async (req, res) => {
  const { candidateId, role } = req.body;
  if (!candidateId)
    return res.status(400).json({ message: "Missing candidateId" });

  const questions = await generateQuestions(role || "fullstack developer");
  STORE.candidates[candidateId] = {
    questions,
    answers: [],
    startedAt: Date.now(),
    status: "in-progress",
  };

  res.json({ questions });
});

// Save answers
app.post("/api/save-answer", (req, res) => {
  const { candidateId, questionId, answer, timeTaken } = req.body;
  const candidate = STORE.candidates[candidateId];
  if (!candidate)
    return res.status(404).json({ message: "Candidate not found" });

  candidate.answers.push({ questionId, answer, timeTaken });
  res.json({ ok: true });
});

// Score interview (MCQ auto, subjective AI)
app.post("/api/score", async (req, res) => {
  const { candidateId } = req.body;
  const candidate = STORE.candidates[candidateId];
  if (!candidate)
    return res.status(404).json({ message: "Candidate not found" });

  let totalScore = 0;
  const details = [];

  for (const q of candidate.questions) {
    const given = candidate.answers.find((a) => a.questionId === q.id);
    if (q.type === "mcq") {
      if (given && given.answer === q.answer) {
        totalScore += 10;
        details.push({ q: q.text, result: "correct", score: 10 });
      } else {
        details.push({
          q: q.text,
          result: "wrong",
          score: 0,
          correctAnswer: q.answer,
        });
      }
    } else {
      if (given && given.answer) {
        const aiEval = await scoreSubjective(q.text, given.answer);
        totalScore += aiEval.score;
        details.push({ q: q.text, result: "ai-scored", ...aiEval });
      } else {
        details.push({
          q: q.text,
          result: "no-answer",
          score: 0,
          rationale: "No answer provided",
        });
      }
    }
  }

  const final = Math.round(
    (totalScore / (candidate.questions.length * 10)) * 100
  );

  // Generate AI summary
  const summary = await generateSummary(
    candidate.questions,
    candidate.answers,
    final
  );

  candidate.score = final;
  candidate.summary = summary;
  candidate.status = "completed";
  candidate.completedAt = Date.now();

  res.json({ score: final, details, summary });
});

app.post("/api/complete-profile", (req, res) => {
  const { candidateId, profile } = req.body;
  if (!candidateId || !profile)
    return res.status(400).json({ message: "Missing fields" });

  if (!STORE.candidates[candidateId])
    STORE.candidates[candidateId] = { answers: [] };
  STORE.candidates[candidateId].profile = profile;

  res.json({ ok: true });
});

// Get all candidates for dashboard
app.get("/api/candidates", (req, res) => {
  const candidates = Object.entries(STORE.candidates).map(([id, data]) => ({
    id,
    ...data.profile,
    score: data.score || 0,
    summary: data.summary || "",
    status: data.status || "not-started",
    completedAt: data.completedAt,
  }));

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  res.json(candidates);
});

// Get single candidate details
app.get("/api/candidates/:id", (req, res) => {
  const candidate = STORE.candidates[req.params.id];
  if (!candidate)
    return res.status(404).json({ message: "Candidate not found" });

  res.json({
    id: req.params.id,
    ...candidate,
  });
});

app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
