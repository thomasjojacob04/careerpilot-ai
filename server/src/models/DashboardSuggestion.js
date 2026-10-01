import mongoose from "mongoose";

// Cached AI suggestions so the dashboard does not call the LLM on every visit.
const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [{ kind: { type: String, enum: ["learn", "certify"] }, title: String, reason: String, _id: false }],
    source: { type: String, enum: ["ai", "basic"], default: "ai" },
    signature: String,
  },
  { timestamps: true }
);

export default mongoose.model("DashboardSuggestion", schema);
