import { Router } from "express";
import db from "../database.js";
import { positiveId } from "../lib/validation.js";

export const preparationNotesRouter = Router();

function noteInput(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (!title) return { error: "Note title is required." } as const;
  if (!content) return { error: "Note content is required." } as const;
  return { value: { title, content } } as const;
}

preparationNotesRouter.get("/", (_req, res) => {
  res.json(db.prepare("SELECT * FROM preparation_notes ORDER BY updated_at DESC, id DESC").all());
});

preparationNotesRouter.post("/", (req, res) => {
  const input = noteInput(req.body);
  if ("error" in input) { res.status(400).json({ error: input.error }); return; }
  const result = db.prepare("INSERT INTO preparation_notes (title, content) VALUES (?, ?)").run(input.value.title, input.value.content);
  res.status(201).json(db.prepare("SELECT * FROM preparation_notes WHERE id = ?").get(result.lastInsertRowid));
});

preparationNotesRouter.put("/:noteId", (req, res) => {
  const noteId = positiveId(req.params.noteId);
  if (!noteId) { res.status(400).json({ error: "Note ID must be a positive number." }); return; }
  const input = noteInput(req.body);
  if ("error" in input) { res.status(400).json({ error: input.error }); return; }
  const result = db.prepare("UPDATE preparation_notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(input.value.title, input.value.content, noteId);
  if (result.changes === 0) { res.status(404).json({ error: "Note not found." }); return; }
  res.json(db.prepare("SELECT * FROM preparation_notes WHERE id = ?").get(noteId));
});

preparationNotesRouter.delete("/:noteId", (req, res) => {
  const noteId = positiveId(req.params.noteId);
  if (!noteId) { res.status(400).json({ error: "Note ID must be a positive number." }); return; }
  const result = db.prepare("DELETE FROM preparation_notes WHERE id = ?").run(noteId);
  if (result.changes === 0) { res.status(404).json({ error: "Note not found." }); return; }
  res.status(204).send();
});
