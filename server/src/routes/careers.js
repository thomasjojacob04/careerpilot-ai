import { Router } from "express";
import { z } from "zod";
import StudentProfile from "../models/StudentProfile.js";
import JobRole from "../models/JobRole.js";
import CareerRecommendation from "../models/CareerRecommendation.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { askJSON, asData } from "../services/groq.service.js";

const router = Router();
router.use(protect, authorize("student"));

const schema = z.object({
  roles: z.array(z.object({
    title: z.string(),
    matchPercent: z.coerce.number().min(0).max(100).default(0),
    reason: z.string().default(""),
    topSkillsToAdd: z.array(z.string()).default([]),
  })).default([]),
});

router.get("/", asyncHandler(async (req, res) =>
  res.json(await CareerRecommendation.findOne({ student: req.user._id }))));

router.post("/recommend", asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
  if (!profile?.skills?.length) throw new HttpError(400, "Add skills to your profile first");
  const catalogue = (await JobRole.find().select("title")).map((r) => r.title);

  const ai = await askJSON({
    system: `You are a career counsellor for engineering students. Suggest the 5 best-fit job roles.
Prefer titles from the provided catalogue when they fit; you may add others. Be honest, do not inflate match percentages.
Return JSON: {"roles": [{"title": "", "matchPercent": 0-100, "reason": "1-2 sentences tied to the student's actual skills/projects", "topSkillsToAdd": ["max 3"]}]} sorted best first.`,
    user: `${asData("catalogue", catalogue.join(", "))}\n${asData("student_profile", JSON.stringify({
      skills: profile.skills.map((s) => `${s.name} (${s.level})`),
      projects: profile.projects.map((p) => ({ title: p.title, tech: p.techStack })),
      interests: profile.interests, targetRole: profile.targetRole, department: profile.department,
    }))}`,
    schema,
  });

  const saved = await CareerRecommendation.findOneAndUpdate(
    { student: req.user._id }, { roles: ai.roles.slice(0, 5) }, { upsert: true, new: true });
  res.json(saved);
}));

export default router;
