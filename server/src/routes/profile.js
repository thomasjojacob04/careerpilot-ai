import { Router } from "express";
import StudentProfile from "../models/StudentProfile.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { profileCompleteness, refreshReadiness } from "../services/readiness.service.js";

const router = Router();
router.use(protect, authorize("student"));

const SECTIONS = ["skills", "certifications", "projects", "education"];
const EDITABLE = ["rollNo", "department", "batch", "cgpa", "backlogs", "phone", "links", "targetRole", "interests"];

const getProfile = (userId) =>
  StudentProfile.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId } }, { upsert: true, new: true });

const respond = (res, profile) => res.json({ profile, completeness: profileCompleteness(profile) });

router.get("/", asyncHandler(async (req, res) => respond(res, await getProfile(req.user._id))));

router.put("/", asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user._id);
  for (const key of EDITABLE) if (req.body[key] !== undefined) profile[key] = req.body[key];
  await profile.save();
  refreshReadiness(req.user._id);
  respond(res, profile);
}));

router.use("/:section", (req, res, next) =>
  SECTIONS.includes(req.params.section) ? next() : next(new HttpError(404, "Unknown profile section")));

router.post("/:section", asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user._id);
  profile[req.params.section].push(req.body);
  await profile.save();
  refreshReadiness(req.user._id);
  respond(res, profile);
}));

router.put("/:section/:id", asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user._id);
  const item = profile[req.params.section].id(req.params.id);
  if (!item) throw new HttpError(404, "Item not found");
  item.set(req.body);
  await profile.save();
  respond(res, profile);
}));

router.delete("/:section/:id", asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user._id);
  const item = profile[req.params.section].id(req.params.id);
  if (!item) throw new HttpError(404, "Item not found");
  item.deleteOne();
  await profile.save();
  refreshReadiness(req.user._id);
  respond(res, profile);
}));

export default router;
