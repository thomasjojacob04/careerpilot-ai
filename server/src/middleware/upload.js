import multer from "multer";
import { HttpError } from "./error.js";

const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Memory storage: resume files are never written to disk (privacy-first).
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, "Only PDF or DOCX files up to 5 MB are allowed")),
}).single("resume");
