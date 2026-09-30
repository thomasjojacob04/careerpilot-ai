import { Router } from "express";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Company from "../models/Company.js";
import PlacementDrive from "../models/PlacementDrive.js";
import SkillGapReport from "../models/SkillGapReport.js";
import InterviewSession from "../models/InterviewSession.js";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

const router = Router();
router.use(protect, authorize("officer"));

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function studentQuery(q) {
  const filter = {};
  if (q.dept) filter.department = q.dept;
  if (q.minReadiness) filter["readiness.score"] = { $gte: Number(q.minReadiness) };
  if (q.search) {
    const rx = new RegExp(escapeRx(String(q.search)), "i");
    const users = await User.find({ role: "student", $or: [{ name: rx }, { email: rx }] }).select("_id");
    filter.$or = [{ user: { $in: users.map((u) => u._id) } }, { rollNo: rx }];
  }
  return filter;
}

router.get("/dashboard", asyncHandler(async (req, res) => {
  const [students, companies, activeDrives, interviews, readiness, ready, upcoming] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Company.countDocuments(),
    PlacementDrive.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
    InterviewSession.countDocuments({ status: "completed" }),
    StudentProfile.aggregate([{ $group: { _id: null, avg: { $avg: "$readiness.score" } } }]),
    StudentProfile.countDocuments({ "readiness.score": { $gte: 70 } }),
    PlacementDrive.find({ status: { $ne: "completed" } }).populate("company", "name").sort("date").limit(5).lean(),
  ]);
  res.json({
    students, companies, activeDrives, interviewsCompleted: interviews,
    avgReadiness: Math.round(readiness[0]?.avg || 0), readyStudents: ready,
    upcomingDrives: upcoming.map((d) => ({ ...d, registeredCount: d.registeredStudents.length, registeredStudents: undefined })),
  });
}));

router.get("/students", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const filter = await studentQuery(req.query);
  const [items, total, departments] = await Promise.all([
    StudentProfile.find(filter).populate("user", "name email")
      .select("user rollNo department batch cgpa backlogs targetRole readiness skills latestAtsScore")
      .sort("-readiness.score").skip((page - 1) * limit).limit(limit).lean(),
    StudentProfile.countDocuments(filter),
    StudentProfile.distinct("department"),
  ]);
  res.json({
    items: items.map((p) => ({ ...p, skillCount: p.skills?.length || 0, skills: undefined })),
    total, page, pages: Math.ceil(total / limit), departments: departments.filter(Boolean),
  });
}));

router.get("/analytics", asyncHandler(async (req, res) => {
  const [histogram, byDept, driveStats, missing, interviews] = await Promise.all([
    StudentProfile.aggregate([
      { $bucket: { groupBy: { $ifNull: ["$readiness.score", 0] }, boundaries: [0, 20, 40, 60, 80, 101], default: "other", output: { count: { $sum: 1 } } } },
    ]),
    StudentProfile.aggregate([
      { $match: { department: { $exists: true, $ne: "" } } },
      { $group: { _id: "$department", avg: { $avg: "$readiness.score" }, students: { $sum: 1 } } },
      { $sort: { avg: -1 } },
    ]),
    PlacementDrive.aggregate([
      { $lookup: { from: "companies", localField: "company", foreignField: "_id", as: "co" } },
      { $project: {
          title: 1, company: { $arrayElemAt: ["$co.name", 0] },
          registered: { $size: "$registeredStudents" },
          shortlisted: { $size: { $filter: { input: "$registeredStudents", as: "r", cond: { $in: ["$$r.status", ["shortlisted", "selected"]] } } } },
          selected: { $size: { $filter: { input: "$registeredStudents", as: "r", cond: { $eq: ["$$r.status", "selected"] } } } },
      } },
      { $sort: { registered: -1 } }, { $limit: 8 },
    ]),
    SkillGapReport.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: { student: "$student", role: "$targetRole" }, missing: { $first: "$missing" } } }, // latest report per student and role
      { $unwind: "$missing" },
      { $group: { _id: "$missing", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]),
    InterviewSession.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, avgScore: { $avg: "$overallScore" } } },
    ]),
  ]);

  const labels = { 0: "0-19", 20: "20-39", 40: "40-59", 60: "60-79", 80: "80-100" };
  res.json({
    readinessDistribution: histogram.filter((b) => b._id !== "other").map((b) => ({ range: labels[b._id], count: b.count })),
    departmentReadiness: byDept.map((d) => ({ department: d._id, avg: Math.round(d.avg || 0), students: d.students })),
    driveFunnel: driveStats,
    topMissingSkills: missing.map((m) => ({ skill: m._id, students: m.count })),
    interviews: interviews.map((i) => ({ status: i._id, count: i.count, avgScore: i.avgScore ? Math.round(i.avgScore * 10) / 10 : null })),
  });
}));

router.get("/export/students.csv", asyncHandler(async (req, res) => {
  const items = await StudentProfile.find(await studentQuery(req.query)).populate("user", "name email").sort("-readiness.score").lean();
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Name", "Email", "Roll No", "Department", "Batch", "CGPA", "Backlogs", "Target Role", "Readiness", "ATS Score"];
  const rows = items.map((p) => [p.user?.name, p.user?.email, p.rollNo, p.department, p.batch, p.cgpa, p.backlogs, p.targetRole, p.readiness?.score, p.latestAtsScore?.score].map(cell).join(","));
  res.set({ "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="students.csv"' });
  res.send([header.join(","), ...rows].join("\n"));
}));

export default router;
