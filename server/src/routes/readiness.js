import { Router } from "express";
import ReadinessSnapshot from "../models/ReadinessSnapshot.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { computeReadiness } from "../services/readiness.service.js";

const router = Router();
router.use(protect, authorize("student"));

router.get("/", asyncHandler(async (req, res) => res.json(await computeReadiness(req.user._id))));

router.get("/history", asyncHandler(async (req, res) =>
  res.json(await ReadinessSnapshot.find({ student: req.user._id }).sort("createdAt").limit(30).select("score createdAt"))));

export default router;
