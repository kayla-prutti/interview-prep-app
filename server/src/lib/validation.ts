export const interviewerTypes = ["recruiter", "hiring_manager", "technical"] as const;
export type InterviewerType = (typeof interviewerTypes)[number];

export type InterviewInput = {
  company: string;
  role: string;
  notes: string;
  interviewer_type: InterviewerType;
  interview_date: string;
};

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function positiveId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function interviewInput(body: unknown): ValidationResult<InterviewInput> {
  const data = (body ?? {}) as Record<string, unknown>;
  const { company, role, notes, interviewer_type, interview_date } = data;

  if (typeof company !== "string" || company.trim() === "") return { ok: false, error: "Company is required." };
  if (typeof role !== "string" || role.trim() === "") return { ok: false, error: "Role is required." };
  if (typeof interview_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(interview_date)) return { ok: false, error: "Interview date is required." };
  if (typeof interviewer_type !== "string" || !interviewerTypes.includes(interviewer_type as InterviewerType)) {
    return { ok: false, error: "Interviewer type must be recruiter, hiring_manager, or technical." };
  }

  return { ok: true, value: { company: company.trim(), role: role.trim(), notes: typeof notes === "string" ? notes.trim() : "", interviewer_type: interviewer_type as InterviewerType, interview_date } };
}

export function questionText(body: unknown): ValidationResult<string> {
  const value = (body as { question_text?: unknown } | null)?.question_text;
  return typeof value === "string" && value.trim() !== ""
    ? { ok: true, value: value.trim() }
    : { ok: false, error: "Question text is required." };
}
