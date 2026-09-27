import { Router } from "express";
import db from "../database.js";
import { positiveId, questionText } from "../lib/validation.js";

export const questionsRouter = Router();

questionsRouter.get("/questions", (_req, res) => {
  res.json(db.prepare(`SELECT questions.id, questions.question_text, questions.created_at, interviews.id AS interview_id, interviews.company, interviews.role, interviews.interviewer_type FROM questions JOIN interviews ON interviews.id = questions.interview_id ORDER BY questions.id DESC`).all());
});

questionsRouter.get("/interviews/:interviewId/questions", (req, res) => {
  const interviewId = positiveId(req.params.interviewId);
  if (!interviewId) { res.status(400).json({ error: "Interview ID must be a positive number." }); return; }
  res.json(db.prepare("SELECT * FROM questions WHERE interview_id = ? ORDER BY id DESC").all(interviewId));
});

questionsRouter.post("/interviews/:interviewId/questions", (req, res) => {
  const interviewId = positiveId(req.params.interviewId);
  if (!interviewId) { res.status(400).json({ error: "Interview ID must be a positive number." }); return; }
  const input = questionText(req.body);
  if (!input.ok) { res.status(400).json({ error: input.error }); return; }
  if (!db.prepare("SELECT id FROM interviews WHERE id = ?").get(interviewId)) { res.status(404).json({ error: "Interview not found." }); return; }
  const result = db.prepare("INSERT INTO questions (interview_id, question_text) VALUES (?, ?)").run(interviewId, input.value);
  res.status(201).json(db.prepare("SELECT * FROM questions WHERE id = ?").get(result.lastInsertRowid));
});

questionsRouter.put("/questions/:questionId", (req, res) => {
  const questionId = positiveId(req.params.questionId);
  if (!questionId) { res.status(400).json({ error: "Question ID must be a positive number." }); return; }
  const input = questionText(req.body);
  if (!input.ok) { res.status(400).json({ error: input.error }); return; }
  const result = db.prepare("UPDATE questions SET question_text = ? WHERE id = ?").run(input.value, questionId);
  if (result.changes === 0) { res.status(404).json({ error: "Question not found." }); return; }
  res.json(db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId));
});

questionsRouter.delete("/questions/:questionId", (req, res) => {
  const questionId = positiveId(req.params.questionId);
  if (!questionId) { res.status(400).json({ error: "Question ID must be a positive number." }); return; }
  const result = db.prepare("DELETE FROM questions WHERE id = ?").run(questionId);
  if (result.changes === 0) { res.status(404).json({ error: "Question not found." }); return; }
  res.status(204).send();
});
