import { Router } from "express";
import { z } from "zod";
import StudentProfile from "../models/StudentProfile.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { uploadResume } from "../middleware/upload.js";
import { askJSON, asData } from "../services/groq.service.js";
import { extractResumeText } from "../services/resumeParser.js";
import { ruleChecks } from "../services/ats.rules.js";
import { refreshReadiness } from "../services/readiness.service.js";

const router = Router();
router.use(protect, authorize("student"));

const aiSchema = z.object({
  atsScore: z.coerce.number().min(0).max(100).default(0),
  keywordMatch: z.coerce.number().min(0).max(100).default(0),
  missingKeywords: z.array(z.string()).default([]),
  formattingIssues: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  sectionFeedback: z.record(z.string()).default({}),
  suggestions: z.array(z.string()).default([]),
});

// Privacy-first: the file is parsed in memory, analysed, and discarded. Only the numeric score is kept.
router.post("/analyze", (req, res, next) => uploadResume(req, res, next), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, "Upload a PDF or DOCX resume");
  const target = String(req.body.target || "").slice(0, 3000);

  const text = await extractResumeText(req.file);
  const rules = ruleChecks(text);

  const ai = await askJSON({
    system: `You are a strict ATS (Applicant Tracking System) reviewer for entry-level tech roles.
Return JSON: {"atsScore": 0-100, "keywordMatch": 0-100, "missingKeywords": [up to 10], "formattingIssues": [], "strengths": [], "sectionFeedback": {"summary": "", "skills": "", "projects": "", "education": ""}, "suggestions": [5-8 specific, actionable improvements]}
Score against the target role or job description if given; otherwise judge general tech-fresher standards.`,
    user: `${asData("target_role_or_jd", target || "General software / tech fresher role", 3000)}\n${asData("resume_text", text, 9000)}`,
    schema: aiSchema,
    temperature: 0.2,
  });

  const finalScore = Math.round(0.6 * ai.atsScore + 0.4 * rules.score);
  await StudentProfile.updateOne({ user: req.user._id }, { latestAtsScore: { score: finalScore, at: new Date() } });
  refreshReadiness(req.user._id);

  res.json({ ...ai, atsScore: finalScore, aiScore: ai.atsScore, ruleScore: rules.score, wordCount: rules.words, checks: rules.checks });
}));

export default router;
