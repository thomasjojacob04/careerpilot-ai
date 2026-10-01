import mongoose from "mongoose";

const schema = new mongoose.Schema({
  category: { type: String, enum: ["quantitative", "logical", "verbal"], required: true },
  question: { type: String, required: true, unique: true },
  options: { type: [String], validate: (v) => v.length === 4 },
  answerIndex: { type: Number, min: 0, max: 3, required: true },
  explanation: String,
});

export default mongoose.model("AptitudeQuestion", schema);
