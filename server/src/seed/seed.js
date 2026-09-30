import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import JobRole from "../models/JobRole.js";
import Company from "../models/Company.js";
import PlacementDrive from "../models/PlacementDrive.js";

const s = (name, weight = 1) => ({ name, weight });

const ROLES = [
  { title: "Full Stack Developer", category: "Software", description: "Builds complete web applications, front to back.",
    requiredSkills: [s("JavaScript", 3), s("React", 3), s("Node.js", 3), s("Express", 2), s("MongoDB", 2), s("HTML", 1), s("CSS", 1), s("Git", 2), s("REST APIs", 2), s("TypeScript", 1), s("Docker", 1)] },
  { title: "Frontend Developer", category: "Software", description: "Builds responsive, accessible user interfaces.",
    requiredSkills: [s("JavaScript", 3), s("React", 3), s("HTML", 2), s("CSS", 2), s("TypeScript", 2), s("Git", 2), s("REST APIs", 1), s("Testing", 1), s("Figma", 1)] },
  { title: "Backend Developer", category: "Software", description: "Designs APIs, databases and server logic.",
    requiredSkills: [s("Node.js", 3), s("Express", 2), s("SQL", 3), s("MongoDB", 2), s("REST APIs", 3), s("Git", 2), s("Docker", 2), s("Data Structures", 3), s("System Design", 1)] },
  { title: "Data Analyst", category: "Data", description: "Turns data into insights and dashboards.",
    requiredSkills: [s("SQL", 3), s("Excel", 2), s("Python", 3), s("Pandas", 2), s("Statistics", 2), s("Power BI", 2), s("Tableau", 1), s("Data Visualization", 2)] },
  { title: "Data Scientist", category: "Data", description: "Builds predictive models from data.",
    requiredSkills: [s("Python", 3), s("Machine Learning", 3), s("Statistics", 3), s("Pandas", 2), s("NumPy", 2), s("Scikit-learn", 2), s("SQL", 2), s("Deep Learning", 1)] },
  { title: "DevOps Engineer", category: "Infrastructure", description: "Automates build, deploy and operations.",
    requiredSkills: [s("Linux", 3), s("Docker", 3), s("Kubernetes", 2), s("CI/CD", 3), s("Git", 2), s("AWS", 2), s("Bash", 2), s("Terraform", 1)] },
  { title: "Software Engineer (Java)", category: "Software", description: "Builds enterprise back-end systems in Java.",
    requiredSkills: [s("Java", 3), s("Data Structures", 3), s("SQL", 2), s("Spring Boot", 2), s("OOP", 2), s("Git", 1), s("REST APIs", 2)] },
];

await mongoose.connect(process.env.MONGO_URI);

for (const r of ROLES) await JobRole.updateOne({ title: r.title }, r, { upsert: true });
console.log(`Job roles: ${ROLES.length}`);

async function ensureUser(name, email, password, role) {
  let u = await User.findOne({ email });
  if (!u) u = await User.create({ name, email, role, passwordHash: await bcrypt.hash(password, 12) });
  return u;
}

const officer = await ensureUser("Placement Officer", "officer@demo.com", "Officer@123", "officer");
const student = await ensureUser("Asha Nair", "student@demo.com", "Student@123", "student");

await StudentProfile.updateOne({ user: student._id }, {
  $setOnInsert: {
    rollNo: "CS21001", department: "Computer Science", batch: "2026", cgpa: 8.2, backlogs: 0, phone: "9876543210",
    links: { github: "https://github.com/asha-demo", linkedin: "https://linkedin.com/in/asha-demo" },
    education: [{ degree: "B.Tech Computer Science", institution: "Demo Institute of Technology", year: "2022-2026", score: "CGPA 8.2" }],
    skills: [{ name: "JavaScript", level: "Advanced" }, { name: "React", level: "Intermediate" }, { name: "Node.js", level: "Intermediate" }, { name: "MongoDB", level: "Intermediate" }, { name: "Git", level: "Intermediate" }],
    projects: [{ title: "Campus Marketplace", description: "Marketplace web app for students to buy and sell items.", techStack: ["React", "Node.js", "MongoDB"] }],
    certifications: [{ title: "Meta Front-End Developer", issuer: "Coursera", date: "2025" }],
    targetRole: "Full Stack Developer", interests: ["Web development", "Open source"],
  },
}, { upsert: true });

const company = await Company.findOneAndUpdate({ name: "Acme Technologies" }, {
  name: "Acme Technologies", industry: "Software", website: "https://example.com", roles: ["Software Engineer"], packageRange: "6-9 LPA",
  description: "Demo recruiter.", createdBy: officer._id,
}, { upsert: true, new: true });

if (!(await PlacementDrive.exists({ company: company._id }))) {
  await PlacementDrive.create({
    company: company._id, title: "Acme Campus Drive 2026", role: "Software Engineer", package: "6-9 LPA", location: "Bengaluru",
    date: new Date(Date.now() + 14 * 864e5), deadline: new Date(Date.now() + 10 * 864e5),
    eligibility: { minCgpa: 7, maxBacklogs: 0, departments: [] }, rounds: ["Online test", "Technical interview", "HR"], status: "upcoming", createdBy: officer._id,
  });
}

console.log("\nSeed complete. Demo logins:\n  officer@demo.com / Officer@123\n  student@demo.com / Student@123");
await mongoose.disconnect();
