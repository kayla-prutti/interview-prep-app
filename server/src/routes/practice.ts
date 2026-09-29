import { Router } from "express";
import db from "../database.js";
import { interviewerTypes, positiveId, type InterviewerType } from "../lib/validation.js";

export const practiceRouter = Router();

practiceRouter.get("/", (req, res) => {
  if (req.query.view === "options") {
    res.json(db.prepare(`
      SELECT practice_interviews.*, 0 AS question_count, 0 AS answered_count
      FROM practice_interviews
      ORDER BY updated_at DESC, id DESC
    `).all());
    return;
  }
  const interviews = db.prepare(`
    SELECT
      practice_interviews.*,
      COUNT(practice_questions.id) AS question_count,
      SUM(CASE WHEN trim(practice_questions.answer) <> '' THEN 1 ELSE 0 END) AS answered_count
    FROM practice_interviews
    LEFT JOIN practice_questions
      ON practice_questions.practice_interview_id = practice_interviews.id
    GROUP BY practice_interviews.id
    ORDER BY practice_interviews.updated_at DESC, practice_interviews.id DESC
  `).all();
  res.json(interviews);
});

practiceRouter.get("/:practiceInterviewId/question-ids", (req, res) => {
  const practiceInterviewId = positiveId(req.params.practiceInterviewId);
  if (!practiceInterviewId) { res.status(400).json({ error: "Prep interview ID must be a positive number." }); return; }
  const questions = db.prepare("SELECT source_question_id FROM practice_questions WHERE practice_interview_id = ? AND source_question_id IS NOT NULL").all(practiceInterviewId) as { source_question_id: number }[];
  res.json(questions.map((question) => question.source_question_id));
});

practiceRouter.post("/", (req, res) => {
  const { company, role, interviewer_type } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof company !== "string" || company.trim() === "") { res.status(400).json({ error: "Company is required." }); return; }
  if (typeof role !== "string" || role.trim() === "") { res.status(400).json({ error: "Role is required." }); return; }
  if (typeof interviewer_type !== "string" || !interviewerTypes.includes(interviewer_type as InterviewerType)) {
    res.status(400).json({ error: "Interview type must be recruiter, hiring_manager, or technical." });
    return;
  }

  const result = db.prepare(`
    INSERT INTO practice_interviews (company, role, interviewer_type)
    VALUES (?, ?, ?)
  `).run(company.trim(), role.trim(), interviewer_type);

  res.status(201).json(db.prepare(`
    SELECT practice_interviews.*, 0 AS question_count, 0 AS answered_count
    FROM practice_interviews WHERE id = ?
  `).get(result.lastInsertRowid));
});

practiceRouter.delete("/:practiceInterviewId", (req, res) => {
  const practiceInterviewId = positiveId(req.params.practiceInterviewId);
  if (!practiceInterviewId) { res.status(400).json({ error: "Prep interview ID must be a positive number." }); return; }
  const result = db.prepare("DELETE FROM practice_interviews WHERE id = ?").run(practiceInterviewId);
  if (result.changes === 0) { res.status(404).json({ error: "Prep interview not found." }); return; }
  res.status(204).send();
});

practiceRouter.get("/:practiceInterviewId/questions", (req, res) => {
  const practiceInterviewId = positiveId(req.params.practiceInterviewId);
  if (!practiceInterviewId) { res.status(400).json({ error: "Prep interview ID must be a positive number." }); return; }
  const questions = db.prepare(`
    SELECT practice_questions.*, interviews.company AS source_company
    FROM practice_questions
    LEFT JOIN questions ON questions.id = practice_questions.source_question_id
    LEFT JOIN interviews ON interviews.id = questions.interview_id
    WHERE practice_questions.practice_interview_id = ?
    ORDER BY practice_questions.sort_order, practice_questions.id
  `).all(practiceInterviewId);
  res.json(questions);
});

practiceRouter.post("/:practiceInterviewId/questions", (req, res) => {
  const practiceInterviewId = positiveId(req.params.practiceInterviewId);
  const sourceQuestionId = positiveId(String((req.body as { source_question_id?: unknown } | null)?.source_question_id ?? ""));
  if (!practiceInterviewId) { res.status(400).json({ error: "Prep interview ID must be a positive number." }); return; }
  if (!sourceQuestionId) { res.status(400).json({ error: "Source question ID is required." }); return; }
  if (!db.prepare("SELECT id FROM practice_interviews WHERE id = ?").get(practiceInterviewId)) { res.status(404).json({ error: "Prep interview not found." }); return; }

  const source = db.prepare("SELECT question_text FROM questions WHERE id = ?").get(sourceQuestionId) as { question_text: string } | undefined;
  if (!source) { res.status(404).json({ error: "Question not found." }); return; }

  try {
    const result = db.prepare(`
      INSERT INTO practice_questions (practice_interview_id, source_question_id, question_text, sort_order)
      VALUES (?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM practice_questions WHERE practice_interview_id = ?), 0))
    `).run(practiceInterviewId, sourceQuestionId, source.question_text, practiceInterviewId);
    db.prepare("UPDATE practice_interviews SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(practiceInterviewId);
    res.status(201).json(db.prepare("SELECT * FROM practice_questions WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) { res.status(409).json({ error: "Question is already in this prep interview." }); return; }
    throw error;
  }
});

practiceRouter.put("/:practiceInterviewId/questions/:practiceQuestionId", (req, res) => {
  const practiceInterviewId = positiveId(req.params.practiceInterviewId);
  const practiceQuestionId = positiveId(req.params.practiceQuestionId);
  const answer = (req.body as { answer?: unknown } | null)?.answer;
  if (!practiceInterviewId || !practiceQuestionId) { res.status(400).json({ error: "Valid prep interview and question IDs are required." }); return; }
  if (typeof answer !== "string") { res.status(400).json({ error: "Answer must be text." }); return; }

  const result = db.prepare(`
    UPDATE practice_questions
    SET answer = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND practice_interview_id = ?
  `).run(answer.trim(), practiceQuestionId, practiceInterviewId);
  if (result.changes === 0) { res.status(404).json({ error: "Practice question not found." }); return; }
  db.prepare("UPDATE practice_interviews SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(practiceInterviewId);
  res.json(db.prepare("SELECT * FROM practice_questions WHERE id = ?").get(practiceQuestionId));
});

practiceRouter.delete("/:practiceInterviewId/questions/:practiceQuestionId", (req, res) => {
  const practiceInterviewId = positiveId(req.params.practiceInterviewId);
  const practiceQuestionId = positiveId(req.params.practiceQuestionId);
  if (!practiceInterviewId || !practiceQuestionId) { res.status(400).json({ error: "Valid prep interview and question IDs are required." }); return; }
  const result = db.prepare("DELETE FROM practice_questions WHERE id = ? AND practice_interview_id = ?").run(practiceQuestionId, practiceInterviewId);
  if (result.changes === 0) { res.status(404).json({ error: "Practice question not found." }); return; }
  db.prepare("UPDATE practice_interviews SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(practiceInterviewId);
  res.status(204).send();
});
