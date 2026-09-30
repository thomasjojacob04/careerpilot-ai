import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    roles: [{ title: String, matchPercent: Number, reason: String, topSkillsToAdd: [String] }],
  },
  { timestamps: true }
);

export default mongoose.model("CareerRecommendation", schema);
