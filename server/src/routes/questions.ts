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
  const practiceInterviewId = Math.max(0, Number(req.query.practiceInterviewId) || 0) || null;
  const favoriteOnly = req.query.favoriteOnly === "true";
  const searchPattern = `%${search}%`;
  const where = "(? = 0 OR questions.is_favorite = 1) AND (? = 'all' OR interviews.interviewer_type = ?) AND (? = '' OR lower(questions.question_text) LIKE ? OR lower(interviews.company) LIKE ? OR lower(interviews.role) LIKE ?)";
  const parameters = [favoriteOnly ? 1 : 0, type, type, search, searchPattern, searchPattern, searchPattern];
  const select = `SELECT questions.id, questions.question_text, questions.created_at, questions.is_favorite, questions.favorite_answer, interviews.id AS interview_id, interviews.company, interviews.role, interviews.interviewer_type,
    CASE WHEN ? IS NULL THEN 0 ELSE EXISTS (
      SELECT 1 FROM practice_questions
      WHERE practice_questions.practice_interview_id = ?
        AND practice_questions.source_question_id = questions.id
    ) END AS is_added_to_practice
    FROM questions JOIN interviews ON interviews.id = questions.interview_id`;
  const items = db.prepare(`${select} WHERE ${where} ORDER BY questions.id DESC LIMIT ? OFFSET ?`).all(practiceInterviewId, practiceInterviewId, ...parameters, limit, offset);
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM questions JOIN interviews ON interviews.id = questions.interview_id WHERE ${where}`).get(...parameters) as { count: number }).count;
  res.json({ items, total });
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

questionsRouter.patch("/questions/:questionId/favorite", (req, res) => {
  const questionId = positiveId(req.params.questionId);
  if (!questionId) { res.status(400).json({ error: "Question ID must be a positive number." }); return; }
  const current = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as { is_favorite: number; favorite_answer: string } | undefined;
  if (!current) { res.status(404).json({ error: "Question not found." }); return; }
  const isFavorite = typeof req.body?.is_favorite === "boolean" ? Number(req.body.is_favorite) : current.is_favorite;
  const favoriteAnswer = typeof req.body?.favorite_answer === "string" ? req.body.favorite_answer.trim() : current.favorite_answer;
  db.prepare("UPDATE questions SET is_favorite = ?, favorite_answer = ? WHERE id = ?").run(isFavorite, favoriteAnswer, questionId);
  res.json(db.prepare("SELECT id, is_favorite, favorite_answer FROM questions WHERE id = ?").get(questionId));
});

questionsRouter.delete("/questions/:questionId", (req, res) => {
  const questionId = positiveId(req.params.questionId);
  if (!questionId) { res.status(400).json({ error: "Question ID must be a positive number." }); return; }
  const result = db.prepare("DELETE FROM questions WHERE id = ?").run(questionId);
  if (result.changes === 0) { res.status(404).json({ error: "Question not found." }); return; }
  res.status(204).send();
});
