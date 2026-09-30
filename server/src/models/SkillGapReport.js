import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetRole: { type: String, required: true },
    matchPercent: { type: Number, default: 0 },
    matched: [String],
    missing: [String],
    learningPath: [
      { order: Number, skill: String, why: String, resources: [String], estimatedTime: String },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SkillGapReport", reportSchema);
