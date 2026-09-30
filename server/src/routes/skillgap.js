import { Router } from "express";
import { z } from "zod";
import JobRole from "../models/JobRole.js";
import StudentProfile from "../models/StudentProfile.js";
import SkillGapReport from "../models/SkillGapReport.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { askJSON, asData } from "../services/groq.service.js";
import { matchSkills } from "../services/skillMatch.js";
import { refreshReadiness } from "../services/readiness.service.js";

const router = Router();
router.use(protect, authorize("student"));

const pathSchema = z.object({
  learningPath: z.array(z.object({
    order: z.coerce.number().default(0),
    skill: z.string(),
    why: z.string().default(""),
    resources: z.array(z.string()).default([]),
    estimatedTime: z.string().default(""),
  })).default([]),
});

router.get("/roles", asyncHandler(async (req, res) =>
  res.json(await JobRole.find().select("title category description").sort("title"))));

router.post("/analyze", validate(z.object({ roleId: z.string().min(1) })), asyncHandler(async (req, res) => {
  const [role, profile] = await Promise.all([
    JobRole.findById(req.body.roleId),
    StudentProfile.findOne({ user: req.user._id }),
  ]);
  if (!role) throw new HttpError(404, "Job role not found");
  if (!profile) throw new HttpError(400, "Complete your profile first");

  const { matched, missing, matchPercent } = matchSkills(profile, role.requiredSkills);

  let learningPath = [];
  if (missing.length) {
    const ai = await askJSON({
      system: `You are a career mentor. Build a learning path for a student to become a ${role.title}.
Return JSON: {"learningPath": [{"order": 1, "skill": "", "why": "one sentence", "resources": ["free course / doc / project idea"], "estimatedTime": "e.g. 2 weeks"}]}
Order skills logically (foundations first). One entry per missing skill.`,
      user: `${asData("student_data", JSON.stringify({ knownSkills: matched, missingSkills: missing }))}`,
      schema: pathSchema,
    });
    learningPath = ai.learningPath;
  }

  const report = await SkillGapReport.create({
    student: req.user._id, targetRole: role.title, matchPercent, matched, missing, learningPath,
  });
  refreshReadiness(req.user._id);
  res.json(report);
}));

router.get("/history", asyncHandler(async (req, res) =>
  res.json(await SkillGapReport.find({ student: req.user._id }).sort("-createdAt").limit(10))));

export default router;
