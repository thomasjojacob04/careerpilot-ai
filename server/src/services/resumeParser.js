import pdfParse from "pdf-parse/lib/pdf-parse.js"; // direct path avoids pdf-parse's debug-mode bug under ESM
import mammoth from "mammoth";
import { HttpError } from "../middleware/error.js";

export async function extractResumeText(file) {
  let text = "";
  if (file.mimetype === "application/pdf") {
    text = (await pdfParse(file.buffer)).text;
  } else {
    text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
  }
  text = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 80) {
    throw new HttpError(422, "No readable text found. Scanned or image-only resumes cannot be analysed.");
  }
  return text;
}
