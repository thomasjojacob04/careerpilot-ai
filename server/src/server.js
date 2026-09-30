import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in server/.env (copy .env.example)`);
    process.exit(1);
  }
}
if (!process.env.GROQ_API_KEY) console.warn("GROQ_API_KEY not set: AI features will return 503 until you add it.");

const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
