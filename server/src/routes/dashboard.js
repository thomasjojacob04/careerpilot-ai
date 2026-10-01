import { Router } from "express";
import rateLimit from "express-rate-limit";
import StudentProfile from "../models/StudentProfile.js";
import PlacementDrive from "../models/PlacementDrive.js";
import InterviewSession from "../models/InterviewSession.js";
import ReadinessSnapshot from "../models/ReadinessSnapshot.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { computeReadiness } from "../services/readiness.service.js";
import { getSuggestions } from "../services/suggestions.service.js";

const router = Router();
router.use(protect, authorize("student"));

const TARGET_PROJECTS = 3;
const suggestionLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, message: { message: "Too many refreshes. Wait a moment." } });
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

router.get("/", asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const readiness = await computeReadiness(userId);
  if (!readiness) throw new HttpError(404, "Profile not found");

  const profile = await StudentProfile.findOne({ user: userId }).lean();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(Date.now() - 7 * 864e5);

  const [oldSnap, firstSnap, interviews, drives] = await Promise.all([
    ReadinessSnapshot.findOne({ student: userId, createdAt: { $lte: weekAgo }, completeness: { $exists: true } }).sort("-createdAt").lean(),
    ReadinessSnapshot.findOne({ student: userId, completeness: { $exists: true } }).sort("createdAt").lean(),
    InterviewSession.countDocuments({ student: userId, status: "completed" }),
    PlacementDrive.find({ status: { $ne: "completed" } }).populate("company", "name").sort("date").lean(),
  ]);
  const ref = oldSnap || firstSnap;
  const completenessDelta = ref ? readiness.completeness - ref.completeness : 0;

  const upcoming = drives
    .filter((d) => !d.date || new Date(d.date) >= startOfToday)
    .map((d) => {
      const mine = d.registeredStudents.find((r) => String(r.student) === String(userId));
      const e = d.eligibility || {};
      const eligible = (profile.cgpa ?? 0) >= (e.minCgpa || 0) && (profile.backlogs ?? 0) <= (e.maxBacklogs ?? 0) &&
        (!e.departments?.length || e.departments.includes(profile.department));
      const closed = d.deadline && new Date(d.deadline) < now;
      const eligibility = mine ? "Registered" : closed ? "Closed" : eligible ? "Open" : "Not eligible";
      return { id: d._id, title: d.title, company: d.company?.name || "", role: d.role, date: d.date, deadline: d.deadline, eligibility, myStatus: mine?.status, createdAt: d.createdAt };
    });

  // Notifications are derived from live data, so nothing extra is stored.
  const notifications = [];
  for (const d of upcoming) {
    if (d.myStatus === "shortlisted" || d.myStatus === "selected")
      notifications.push({ tone: "ok", text: `You are ${d.myStatus} for ${d.title}${d.company ? ` at ${d.company}` : ""}.` });
    if (d.eligibility === "Open") {
      const daysLeft = d.deadline ? Math.ceil((new Date(d.deadline) - now) / 864e5) : null;
      if (daysLeft !== null && daysLeft <= 3) notifications.push({ tone: "warn", text: `Registration for ${d.title} closes ${fmt(d.deadline)}.` });
      else if (now - new Date(d.createdAt) < 7 * 864e5) notifications.push({ tone: "brand", text: `New drive you can join: ${d.title}${d.company ? ` at ${d.company}` : ""}.` });
    }
  }

  res.json({
    name: req.user.name,
    readiness: { score: readiness.score, status: readiness.status, breakdown: readiness.breakdown },
    stats: {
      completeness: readiness.completeness, completenessDelta,
      certifications: profile.certifications?.length || 0,
      projects: profile.projects?.length || 0,
      projectsRecommended: Math.max(0, TARGET_PROJECTS - (profile.projects?.length || 0)),
      interviews,
    },
    drives: upcoming.slice(0, 5).map(({ myStatus, createdAt, ...d }) => d),
    notifications,
  });
}));

router.get("/suggestions", suggestionLimiter, asyncHandler(async (req, res) => {
  const doc = await getSuggestions(req.user._id, { force: req.query.refresh === "1" });
  res.json({ items: doc.items, source: doc.source, updatedAt: doc.updatedAt });
}));

export default router;
