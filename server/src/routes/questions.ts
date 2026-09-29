import { Router } from "express";
import db from "../database.js";
import { positiveId, questionText } from "../lib/validation.js";

export const questionsRouter = Router();

questionsRouter.get("/questions/page", (req, res) => {
  const search = String(req.query.search ?? "").trim().toLowerCase();
  const requestedType = String(req.query.type ?? "all");
  const type = ["recruiter", "hiring_manager", "technical"].includes(requestedType) ? requestedType : "all";
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const includeCounts = String(req.query.includeCounts ?? "true") !== "false";
  const searchPattern = `%${search}%`;
  const where = "(? = 'all' OR interviews.interviewer_type = ?) AND (? = '' OR lower(questions.question_text) LIKE ? OR lower(interviews.company) LIKE ? OR lower(interviews.role) LIKE ?)";
  const parameters = [type, type, search, searchPattern, searchPattern, searchPattern];
  const select = "SELECT questions.id, questions.question_text, questions.created_at, interviews.id AS interview_id, interviews.company, interviews.role, interviews.interviewer_type FROM questions JOIN interviews ON interviews.id = questions.interview_id";
  const items = db.prepare(`${select} WHERE ${where} ORDER BY questions.id DESC LIMIT ? OFFSET ?`).all(...parameters, limit, offset);
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM questions JOIN interviews ON interviews.id = questions.interview_id WHERE ${where}`).get(...parameters) as { count: number }).count;
  const countRows = includeCounts
    ? db.prepare(`SELECT interviews.interviewer_type, COUNT(*) AS count FROM questions JOIN interviews ON interviews.id = questions.interview_id WHERE (? = '' OR lower(questions.question_text) LIKE ? OR lower(interviews.company) LIKE ? OR lower(interviews.role) LIKE ?) GROUP BY interviews.interviewer_type`).all(search, searchPattern, searchPattern, searchPattern) as { interviewer_type: string; count: number }[]
    : [];
  const counts = includeCounts ? {
    all: countRows.reduce((sum, row) => sum + row.count, 0),
    recruiter: countRows.find((row) => row.interviewer_type === "recruiter")?.count ?? 0,
    hiring_manager: countRows.find((row) => row.interviewer_type === "hiring_manager")?.count ?? 0,
    technical: countRows.find((row) => row.interviewer_type === "technical")?.count ?? 0,
  } : undefined;
  res.json({ items, total, ...(counts ? { counts } : {}) });
});

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
