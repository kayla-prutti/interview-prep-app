import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "IPREP_USER_EMAIL", "IPREP_USER_PASSWORD"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
}

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const database = new Database(process.env.IPREP_DB_PATH ?? "data/interview-prep.db", { readonly: true });
const email = process.env.IPREP_USER_EMAIL.toLowerCase();

const users = await admin.auth.admin.listUsers({ perPage: 1000 });
if (users.error) throw users.error;
let user = users.data.users.find((candidate) => candidate.email?.toLowerCase() === email);
if (!user) {
  const created = await admin.auth.admin.createUser({ email, password: process.env.IPREP_USER_PASSWORD, email_confirm: true });
  if (created.error) throw created.error;
  user = created.data.user;
}

const existing = await admin.from("interviews").select("id", { count: "exact", head: true }).eq("user_id", user.id);
if (existing.error) throw existing.error;
if ((existing.count ?? 0) > 0) throw new Error("This account already has interview data. Import stopped to avoid duplicates.");

const interviewRows = database.prepare("select * from interviews order by id").all();
const questionRows = database.prepare("select * from questions order by id").all();
const prepRows = database.prepare("select * from practice_interviews order by id").all();
const prepQuestionRows = database.prepare("select * from practice_questions order by id").all();
const interviewIds = new Map();
const questionIds = new Map();
const prepIds = new Map();

for (const row of interviewRows) {
  const result = await admin.from("interviews").insert({ user_id: user.id, company: row.company, role: row.role, notes: row.notes, interviewer_type: row.interviewer_type, interview_date: row.interview_date, created_at: row.created_at }).select("id").single();
  if (result.error) throw result.error;
  interviewIds.set(row.id, result.data.id);
}

for (const row of questionRows) {
  const result = await admin.from("questions").insert({ user_id: user.id, interview_id: interviewIds.get(row.interview_id), question_text: row.question_text, created_at: row.created_at }).select("id").single();
  if (result.error) throw result.error;
  questionIds.set(row.id, result.data.id);
}

for (const row of prepRows) {
  const result = await admin.from("practice_interviews").insert({ user_id: user.id, company: row.company, role: row.role, notes: row.notes ?? "", interviewer_type: row.interviewer_type, created_at: row.created_at, updated_at: row.updated_at }).select("id").single();
  if (result.error) throw result.error;
  prepIds.set(row.id, result.data.id);
}

for (const row of prepQuestionRows) {
  const result = await admin.from("practice_questions").insert({ user_id: user.id, practice_interview_id: prepIds.get(row.practice_interview_id), source_question_id: row.source_question_id ? questionIds.get(row.source_question_id) : null, question_text: row.question_text, answer: row.answer, sort_order: row.sort_order, created_at: row.created_at, updated_at: row.updated_at });
  if (result.error) throw result.error;
}

console.log(`Imported ${interviewRows.length} interviews, ${questionRows.length} questions, ${prepRows.length} preparation interviews, and ${prepQuestionRows.length} preparation questions for ${email}.`);
