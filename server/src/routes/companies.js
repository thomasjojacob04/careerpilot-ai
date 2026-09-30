import { Router } from "express";
import { z } from "zod";
import Company from "../models/Company.js";
import PlacementDrive from "../models/PlacementDrive.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(protect, authorize("officer"));

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  industry: z.string().trim().max(80).optional(),
  website: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  roles: z.array(z.string().trim()).default([]),
  packageRange: z.string().trim().max(60).optional(),
});

router.get("/", asyncHandler(async (req, res) => res.json(await Company.find().sort("name"))));

router.post("/", validate(schema), asyncHandler(async (req, res) =>
  res.status(201).json(await Company.create({ ...req.body, createdBy: req.user._id }))));

router.put("/:id", validate(schema), asyncHandler(async (req, res) => {
  const c = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) throw new HttpError(404, "Company not found");
  res.json(c);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  if (await PlacementDrive.exists({ company: req.params.id })) {
    throw new HttpError(409, "This company has placement drives. Delete those first.");
  }
  await Company.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default router;
