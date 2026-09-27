import { Router } from "express";
import db from "../database.js";
import { interviewInput, positiveId } from "../lib/validation.js";

export const interviewsRouter = Router();

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
