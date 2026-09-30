import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";

mkdirSync("data", { recursive: true });

const db = new Database("data/interview-prep.db");

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    interview_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    interview_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id)
      REFERENCES interviews(id)
      ON DELETE CASCADE
  );
`);

const columns = db
  .prepare("PRAGMA table_info(interviews)")
  .all() as { name: string }[];

if (!columns.some((column) => column.name === "interviewer_type")) {
  db.exec(`
    ALTER TABLE interviews
    ADD COLUMN interviewer_type TEXT
    CHECK (
      interviewer_type IN (
        'recruiter',
        'hiring_manager',
        'technical'
      )
    )
  `);
}

if (!columns.some((column) => column.name === "interview_date")) {
  db.exec(`
    ALTER TABLE interviews
    ADD COLUMN interview_date TEXT
  `);
}

db.prepare(`
  UPDATE interviews
  SET interview_date = substr(created_at, 1, 10)
  WHERE interview_date IS NULL
`).run();

const questionColumns = db
  .prepare("PRAGMA table_info(questions)")
  .all() as { name: string }[];

if (!questionColumns.some((column) => column.name === "interviewer_type")) {
  db.exec(`
    ALTER TABLE questions
    ADD COLUMN interviewer_type TEXT
    CHECK (
      interviewer_type IN (
        'recruiter',
        'hiring_manager',
        'technical'
      )
    )
  `);
}

db.exec(`
  UPDATE questions
  SET interviewer_type = (
    SELECT interviews.interviewer_type
    FROM interviews
    WHERE interviews.id = questions.interview_id
  )
  WHERE interviewer_type IS NULL;

  CREATE TRIGGER IF NOT EXISTS questions_set_interviewer_type_after_insert
  AFTER INSERT ON questions
  BEGIN
    UPDATE questions
    SET interviewer_type = (
      SELECT interviews.interviewer_type
      FROM interviews
      WHERE interviews.id = NEW.interview_id
    )
    WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS questions_sync_interviewer_type_after_interview_update
  AFTER UPDATE OF interviewer_type ON interviews
  BEGIN
    UPDATE questions
    SET interviewer_type = NEW.interviewer_type
    WHERE interview_id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS questions_sync_interviewer_type_after_interview_change
  AFTER UPDATE OF interview_id ON questions
  BEGIN
    UPDATE questions
    SET interviewer_type = (
      SELECT interviews.interviewer_type
      FROM interviews
      WHERE interviews.id = NEW.interview_id
    )
    WHERE id = NEW.id;
  END;

  CREATE TABLE IF NOT EXISTS practice_interviews (
    id INTEGER PRIMARY KEY,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    interviewer_type TEXT NOT NULL CHECK (
      interviewer_type IN ('recruiter', 'hiring_manager', 'technical')
    ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS practice_questions (
    id INTEGER PRIMARY KEY,
    practice_interview_id INTEGER NOT NULL,
    source_question_id INTEGER,
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (practice_interview_id)
      REFERENCES practice_interviews(id)
      ON DELETE CASCADE,
    FOREIGN KEY (source_question_id)
      REFERENCES questions(id)
      ON DELETE SET NULL,
    UNIQUE (practice_interview_id, source_question_id)
  );

  CREATE TABLE IF NOT EXISTS preparation_notes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS interviews_type_date_idx
  ON interviews(interviewer_type, interview_date DESC, id DESC);

  CREATE INDEX IF NOT EXISTS questions_interview_id_idx
  ON questions(interview_id);

  CREATE INDEX IF NOT EXISTS questions_type_id_idx
  ON questions(interviewer_type, id DESC);
`);

const preparationNoteColumns = db
  .prepare("PRAGMA table_info(preparation_notes)")
  .all() as { name: string }[];

if (!preparationNoteColumns.some((column) => column.name === "color")) {
  db.exec(`
    ALTER TABLE preparation_notes
    ADD COLUMN color TEXT NOT NULL DEFAULT 'yellow'
    CHECK (color IN ('yellow', 'pink', 'blue', 'green', 'orange'))
  `);
}

export default db;
