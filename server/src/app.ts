import cors from "cors";
import express from "express";
import { interviewsRouter } from "./routes/interviews.js";
import { questionsRouter } from "./routes/questions.js";
import { practiceRouter } from "./routes/practice.js";
import { preparationNotesRouter } from "./routes/preparationNotes.js";

export const app = express();

app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "i-Prep is running" });
});

app.use("/interviews", interviewsRouter);
app.use(questionsRouter);
app.use("/practice-interviews", practiceRouter);
app.use("/preparation-notes", preparationNotesRouter);
