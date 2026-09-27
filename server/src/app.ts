import cors from "cors";
import express from "express";
import { interviewsRouter } from "./routes/interviews.js";
import { questionsRouter } from "./routes/questions.js";

export const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "i-Prep is running" });
});

app.use("/interviews", interviewsRouter);
app.use(questionsRouter);
