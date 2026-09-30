import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true },
    breakdown: { profile: Number, resume: Number, skills: Number, interview: Number },
  },
  { timestamps: true }
);

export default mongoose.model("ReadinessSnapshot", snapshotSchema);
