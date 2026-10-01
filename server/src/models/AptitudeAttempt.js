import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    total: Number,
    correct: Number,
    percent: Number,
  },
  { timestamps: true }
);

export default mongoose.model("AptitudeAttempt", schema);
