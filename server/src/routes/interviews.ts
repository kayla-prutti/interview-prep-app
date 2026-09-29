import { Router } from "express";
import db from "../database.js";
import { interviewInput, positiveId } from "../lib/validation.js";

export const interviewsRouter = Router();

interviewsRouter.get("/page", (req, res) => {
  const search = String(req.query.search ?? "").trim().toLowerCase();
  const requestedType = String(req.query.type ?? "all");
  const type = ["recruiter", "hiring_manager", "technical"].includes(requestedType) ? requestedType : "all";
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const searchPattern = `%${search}%`;
  const where = "(? = 'all' OR interviewer_type = ?) AND (? = '' OR lower(company) LIKE ?)";
  const parameters = [type, type, search, searchPattern];
  const items = db.prepare(`SELECT * FROM interviews WHERE ${where} ORDER BY interview_date DESC, id DESC LIMIT ? OFFSET ?`).all(...parameters, limit, offset);
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM interviews WHERE ${where}`).get(...parameters) as { count: number }).count;
  res.json({ items, total });
});

interviewsRouter.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM interviews ORDER BY interview_date DESC, id DESC").all());
});

interviewsRouter.post("/", (req, res) => {
  const input = interviewInput(req.body);
  if (!input.ok) { res.status(400).json({ error: input.error }); return; }
  const { company, role, notes, interviewer_type, interview_date } = input.value;
  const result = db.prepare(`INSERT INTO interviews (company, role, notes, interviewer_type, interview_date) VALUES (?, ?, ?, ?, ?)`).run(company, role, notes, interviewer_type, interview_date);
  res.status(201).json(db.prepare("SELECT * FROM interviews WHERE id = ?").get(result.lastInsertRowid));
});

interviewsRouter.put("/:interviewId", (req, res) => {
  const interviewId = positiveId(req.params.interviewId);
  if (!interviewId) { res.status(400).json({ error: "Interview ID must be a positive number." }); return; }
  const input = interviewInput(req.body);
  if (!input.ok) { res.status(400).json({ error: input.error }); return; }
  const { company, role, notes, interviewer_type, interview_date } = input.value;
  const result = db.prepare(`UPDATE interviews SET company = ?, role = ?, notes = ?, interviewer_type = ?, interview_date = ? WHERE id = ?`).run(company, role, notes, interviewer_type, interview_date, interviewId);
  if (result.changes === 0) { res.status(404).json({ error: "Interview not found." }); return; }
  res.json(db.prepare("SELECT * FROM interviews WHERE id = ?").get(interviewId));
});

interviewsRouter.delete("/:interviewId", (req, res) => {
  const interviewId = positiveId(req.params.interviewId);
  if (!interviewId) { res.status(400).json({ error: "Interview ID must be a positive number." }); return; }
  const result = db.prepare("DELETE FROM interviews WHERE id = ?").run(interviewId);
  if (result.changes === 0) { res.status(404).json({ error: "Interview not found." }); return; }
  res.status(204).send();
});
