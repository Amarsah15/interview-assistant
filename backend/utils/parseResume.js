import pdf from "pdf-parse";
import mammoth from "mammoth";

// Suppress pdf-parse TT warnings
const originalWarn = console.warn;
console.warn = function (message) {
  if (
    message &&
    typeof message === "string" &&
    message.includes("TT: undefined function")
  ) {
    return;
  }
  originalWarn.apply(console, arguments);
};

export function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

export function extractPhone(text) {
  // Remove all whitespace and newlines first
  const cleanText = text.replace(/[\s\n\r]/g, "");

  // Indian phone number patterns
  const patterns = [
    /(\+91)?[6-9]\d{9}/, // Indian mobile (10 digits starting with 6-9)
    /\d{10}/, // Simple 10 digits
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // With separators
  ];

  for (let pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      // Return only digits, remove +91
      let phone = match[0].replace(/\D/g, "");
      if (phone.startsWith("91") && phone.length === 12) {
        phone = phone.substring(2);
      }
      if (phone.length === 10) {
        return phone;
      }
    }
  }

  return null;
}

export function extractName(text) {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Skip common header words
  const skipWords = [
    "resume",
    "cv",
    "curriculum",
    "vitae",
    "profile",
    "contact",
    "email",
    "phone",
    "address",
    "objective",
    "education",
    "experience",
    "skills",
    "projects",
  ];

  for (let line of lines) {
    // Skip if line is too short or too long
    if (line.length < 3 || line.length > 50) continue;

    // Skip if contains special characters (likely not a name)
    if (/[@#$%^&*()_+=\[\]{}|\\:;"'<>,.?\/\d]/.test(line)) continue;

    // Skip if matches common headers
    const lowerLine = line.toLowerCase();
    if (skipWords.some((word) => lowerLine.includes(word))) continue;

    // Skip if it looks like a date
    if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line))
      continue;
    if (/\d{4}/.test(line)) continue; // Contains year

    // If we made it here, it's likely a name
    if (line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 4) {
      return line;
    }
  }

  // Fallback to first line if nothing found
  return lines.length ? lines[0] : null;
}

export async function parsePDF(buffer) {
  try {
    const data = await pdf(buffer, {
      max: 0,
    });
    console.log("Extracted text length:", data.text.length);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF");
  }
}

export async function parseDOCX(buffer) {
  try {
    const res = await mammoth.extractRawText({ buffer });
    console.log("Extracted text length:", res.value.length);
    return res.value;
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error("Failed to parse DOCX");
  }
}
