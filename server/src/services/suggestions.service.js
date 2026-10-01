import crypto from "crypto";
import { z } from "zod";
import StudentProfile from "../models/StudentProfile.js";
import JobRole from "../models/JobRole.js";
import SkillGapReport from "../models/SkillGapReport.js";
import DashboardSuggestion from "../models/DashboardSuggestion.js";
import { HttpError } from "../middleware/error.js";
import { askJSON, asData } from "./groq.service.js";
import { matchSkills } from "./skillMatch.js";

const DAY = 24 * 60 * 60 * 1000;
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const schema = z.object({
  learn: z.array(z.object({ title: z.string().min(2), reason: z.string().default("") })).default([]),
  certify: z.array(z.object({ title: z.string().min(2), reason: z.string().default("") })).default([]),
});

const GENERIC_CERTS = [
  { title: "AWS Certified Cloud Practitioner", reason: "validates core cloud knowledge that employers look for" },
  { title: "Microsoft Azure Fundamentals (AZ-900)", reason: "shows foundational knowledge of cloud services" },
  { title: "Google Cloud Digital Leader", reason: "demonstrates cloud and digital transformation basics" },
];

/** Changes when the parts of the profile that drive suggestions change. */
const signatureOf = (p) =>
  crypto.createHash("md5").update(JSON.stringify({
    t: p.targetRole, s: (p.skills || []).map((x) => x.name).sort(),
    c: (p.certifications || []).map((x) => x.title).sort(), p: (p.projects || []).map((x) => x.title).sort(),
  })).digest("hex");

async function missingSkillsFor(profile, userId) {
  if (profile.targetRole) {
    const role = await JobRole.findOne({ title: new RegExp(`^${escapeRx(profile.targetRole)}$`, "i") });
    if (role) return matchSkills(profile, role.requiredSkills).missing;
  }
  const report = await SkillGapReport.findOne({ student: userId }).sort("-createdAt");
  return report?.missing || [];
}

const alreadyHas = (profile, title) =>
  (profile.certifications || []).some((c) => {
    const a = c.title.toLowerCase(), b = title.toLowerCase();
    return a.includes(b) || b.includes(a);
  });

async function aiSuggestions(profile, missing) {
  const ai = await askJSON({
    system: `You are a career mentor for engineering students. Suggest what the student should do next.
Return JSON: {"learn": [{"title": "skill or tool name", "reason": "short phrase on what it is used for, no trailing period"}], "certify": [{"title": "official certification name", "reason": "short phrase on what it validates, no trailing period"}]}
Give exactly 3 items in each list. "learn": skills or tools the student does NOT already have and that matter for the target role (prefer the missing skills provided). "certify": real, well-known certifications that the student does not already hold. Never invent certification names.`,
    user: asData("student", JSON.stringify({
      targetRole: profile.targetRole || "not set", department: profile.department,
      skills: (profile.skills || []).map((s) => s.name), projects: (profile.projects || []).map((p) => p.title),
      certificationsHeld: (profile.certifications || []).map((c) => c.title), missingSkills: missing,
    })),
    schema,
    temperature: 0.4,
  });
  const learn = ai.learn.slice(0, 3).map((x) => ({ kind: "learn", ...x }));
  const certify = ai.certify.filter((c) => !alreadyHas(profile, c.title)).slice(0, 3).map((x) => ({ kind: "certify", ...x }));
  if (!learn.length && !certify.length) throw new Error("empty AI suggestions");
  return [...learn, ...certify];
}

function basicSuggestions(profile, missing) {
  const role = profile.targetRole || "your target";
  return [
    ...missing.slice(0, 3).map((title) => ({ kind: "learn", title, reason: `a skill ${role} roles commonly require` })),
    ...GENERIC_CERTS.filter((c) => !alreadyHas(profile, c.title)).slice(0, 3).map((c) => ({ kind: "certify", ...c })),
  ];
}

export async function getSuggestions(userId, { force = false } = {}) {
  const profile = await StudentProfile.findOne({ user: userId }).lean();
  if (!profile) throw new HttpError(404, "Profile not found");

  const signature = signatureOf(profile);
  const cached = await DashboardSuggestion.findOne({ student: userId });
  if (!force && cached && cached.signature === signature) {
    // AI results stay for a day. Fallback results are retried sooner, in case the AI was only rate limited.
    const ttl = cached.source === "ai" ? DAY : 10 * 60 * 1000;
    if (Date.now() - cached.updatedAt.getTime() < ttl) return cached;
  }

  const missing = await missingSkillsFor(profile, userId);
  let items, source;
  try {
    items = await aiSuggestions(profile, missing);
    source = "ai";
  } catch (err) {
    console.warn("suggestions fallback:", err.message);
    items = basicSuggestions(profile, missing);
    source = "basic";
  }
  return DashboardSuggestion.findOneAndUpdate({ student: userId }, { items, source, signature }, { upsert: true, new: true });
}
