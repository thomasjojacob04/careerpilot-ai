import mongoose from "mongoose";
const { Schema } = mongoose;

const scoreSchema = new Schema(
  { clarity: Number, correctness: Number, completeness: Number, communication: Number },
  { _id: false }
);

const sessionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    questions: [
      {
        text: String,
        type: { type: String, default: "technical" },
        expectedPoints: [String], // server-only, never sent to the client during the interview
        answerTranscript: String,
        scores: scoreSchema,
        feedback: String,
        improvement: String,
        answeredAt: Date,
      },
    ],
    overallScore: Number, // 0-10
    summary: { text: String, strengths: [String], weaknesses: [String], nextSteps: [String] },
    status: { type: String, enum: ["in_progress", "completed", "cancelled"], default: "in_progress" },
    cancelReason: String,
    violations: [{ type: { type: String }, timestamp: { type: Date, default: Date.now } }],
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("InterviewSession", sessionSchema);
