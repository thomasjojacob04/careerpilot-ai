import StudentProfile from "../models/StudentProfile.js";
import SkillGapReport from "../models/SkillGapReport.js";
import InterviewSession from "../models/InterviewSession.js";
import ReadinessSnapshot from "../models/ReadinessSnapshot.js";

export function profileCompleteness(p) {
  const part = (n, target, weight) => Math.min(n / target, 1) * weight;
  const flag = (v, weight) => (v ? weight : 0);
  const score =
    flag(p.rollNo, 5) + flag(p.department, 10) + flag(p.batch, 5) +
    flag(p.cgpa != null, 10) + flag(p.phone, 5) +
    flag(p.links?.github || p.links?.linkedin, 5) +
    flag(p.education?.length > 0, 10) +
    part(p.skills?.length || 0, 5, 15) +
    part(p.projects?.length || 0, 2, 15) +
    part(p.certifications?.length || 0, 1, 5) +
    flag(p.targetRole, 10) + flag(p.interests?.length > 0, 5);
  return Math.round(score);
}

/**
 * Readiness = 25% profile + 25% resume (latest ATS score) + 25% skill match + 25% avg of last 3 interviews.
 */
export async function computeReadiness(userId) {
  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) return null;

  const profilePct = profileCompleteness(profile);
  const resume = profile.latestAtsScore?.score ?? 0;

  const reportQuery = { student: userId };
  if (profile.targetRole) reportQuery.targetRole = profile.targetRole;
  const report = (await SkillGapReport.findOne(reportQuery).sort({ createdAt: -1 })) ||
    (await SkillGapReport.findOne({ student: userId }).sort({ createdAt: -1 }));
  const skills = report?.matchPercent ?? 0;

  const sessions = await InterviewSession.find({ student: userId, status: "completed" })
    .sort({ endedAt: -1 }).limit(3);
  const interview = sessions.length
    ? Math.round((sessions.reduce((s, x) => s + (x.overallScore || 0), 0) / sessions.length) * 10)
    : 0;

  const score = Math.round(0.25 * profilePct + 0.25 * resume + 0.25 * skills + 0.25 * interview);
  profile.readiness = { score, updatedAt: new Date() };
  await profile.save();

  const last = await ReadinessSnapshot.findOne({ student: userId }).sort({ createdAt: -1 });
  if (!last || last.score !== score) {
    await ReadinessSnapshot.create({
      student: userId, score,
      breakdown: { profile: profilePct, resume, skills, interview },
    });
  }
  return {
    score,
    breakdown: { profile: profilePct, resume, skills, interview },
    flags: {
      atsRun: profile.latestAtsScore?.score != null,
      skillGapRun: !!report,
      interviewsDone: sessions.length,
    },
  };
}

/** Fire-and-forget wrapper: readiness must never break the main request. */
export const refreshReadiness = (userId) => computeReadiness(userId).catch((e) => console.error("readiness:", e.message));
