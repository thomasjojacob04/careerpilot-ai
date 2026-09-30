import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { protect, signToken } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(["student", "officer"]).default("student"),
  inviteCode: z.string().optional(),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post("/register", validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role, inviteCode } = req.body;
  // Officers cannot self-register without the institution's invite code.
  if (role === "officer" && (!process.env.OFFICER_INVITE_CODE || inviteCode !== process.env.OFFICER_INVITE_CODE)) {
    throw new HttpError(403, "A valid officer invite code is required");
  }
  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, "An account with this email already exists");

  const user = await User.create({ name, email, role, passwordHash: await bcrypt.hash(password, 12) });
  if (role === "student") await StudentProfile.create({ user: user._id });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post("/login", validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) throw new HttpError(401, "Incorrect email or password");
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get("/me", protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
