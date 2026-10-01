import mongoose from "mongoose";
const { Schema } = mongoose;

// One saved resume per student: the edited content plus the chosen design.
// Stored as-is so a page refresh (or a different device) restores exactly what was on screen.
const savedResumeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    template: { type: String, default: "professional" },
    resume: { type: Schema.Types.Mixed, required: true },
    style: { type: Schema.Types.Mixed },
    layout: { type: Schema.Types.Mixed },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model("SavedResume", savedResumeSchema);