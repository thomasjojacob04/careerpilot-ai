import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true },
    completeness: Number,
    breakdown: {
      technical: Number, certifications: Number, projects: Number,
      aptitude: Number, communication: Number, academics: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ReadinessSnapshot", snapshotSchema);
