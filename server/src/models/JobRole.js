import mongoose from "mongoose";

const jobRoleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  category: String,
  description: String,
  requiredSkills: [{ name: String, weight: { type: Number, default: 1 } }],
});

export default mongoose.model("JobRole", jobRoleSchema);
