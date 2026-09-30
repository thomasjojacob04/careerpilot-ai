import { Router } from "express";
import { z } from "zod";
import StudentProfile from "../models/StudentProfile.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { askJSON, asData } from "../services/groq.service.js";
import { htmlToPdf } from "../services/pdf.service.js";
import { renderResumeHtml, TEMPLATES } from "../utils/resumeTemplate.js";

const router = Router();
router.use(protect, authorize("student"));

const aiSchema = z.object({
  summary: z.string().default(""),
  projects: z.array(z.object({ title: z.string(), bullets: z.array(z.string()).default([]) })).default([]),
  skills: z.record(z.array(z.string())).default({}),
});

const resumeBody = z.object({
  template: z.enum(TEMPLATES).default("classic"),
  resume: z.object({
    name: z.string().max(120),
    email: z.string().max(120).optional(),
    phone: z.string().max(40).optional(),
    links: z.object({ github: z.string().optional(), linkedin: z.string().optional(), portfolio: z.string().optional() }).partial().optional(),
    summary: z.string().max(1500).optional(),
    education: z.array(z.any()).max(10).optional(),
    skills: z.record(z.array(z.string())).optional(),
    projects: z.array(z.any()).max(12).optional(),
    certifications: z.array(z.any()).max(15).optional(),
  }),
});

router.post("/generate", asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
  if (!profile || !profile.skills?.length) throw new HttpError(400, "Add at least a few skills and one project to your profile first");

  const facts = {
    targetRole: profile.targetRole,
    skills: profile.skills.map((s) => `${s.name} (${s.level})`),
    projects: profile.projects.map((p) => ({ title: p.title, description: p.description, techStack: p.techStack })),
    education: profile.education,
    certifications: profile.certifications.map((c) => c.title),
  };

  const ai = await askJSON({
    system: `You write concise, honest fresher resumes. Use ONLY the facts provided. Never invent employers, metrics, or achievements.
Return JSON: {"summary": "2-3 sentence professional summary without first-person pronouns", "projects": [{"title": "must match input title", "bullets": ["2-3 bullets starting with strong action verbs"]}], "skills": {"Languages": [], "Frameworks & Libraries": [], "Databases": [], "Tools & Platforms": [], "Concepts": []}}
Only include skill groups that have entries and only skills from the input.`,
    user: asData("student_facts", JSON.stringify(facts)),
    schema: aiSchema,
  });

  const byTitle = new Map(ai.projects.map((p) => [p.title.toLowerCase(), p.bullets]));
  const resume = {
    name: req.user.name,
    email: req.user.email,
    phone: profile.phone,
    links: profile.links || {},
    summary: ai.summary,
    education: profile.education || [],
    skills: ai.skills,
    projects: profile.projects.map((p) => ({
      title: p.title,
      techStack: p.techStack,
      bullets: byTitle.get(p.title.toLowerCase()) || (p.description ? [p.description] : []),
    })),
    certifications: profile.certifications || [],
  };
  res.json({ resume, html: renderResumeHtml(resume, "classic") });
}));

router.post("/preview", validate(resumeBody), (req, res) =>
  res.json({ html: renderResumeHtml(req.body.resume, req.body.template) }));

router.post("/pdf", validate(resumeBody), asyncHandler(async (req, res) => {
  const pdf = await htmlToPdf(renderResumeHtml(req.body.resume, req.body.template));
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="resume.pdf"' });
  res.send(pdf);
}));

export default router;
