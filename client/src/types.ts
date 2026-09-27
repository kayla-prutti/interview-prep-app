export type InterviewerType = "recruiter" | "hiring_manager" | "technical";
export type InterviewFilter = "all" | InterviewerType;
export type Page = "interviews" | "questions" | "practice";

export type Interview = {
  id: number;
  company: string;
  role: string;
  notes: string;
  interviewer_type: InterviewerType;
  interview_date: string | null;
  created_at: string;
};

export type Question = {
  id: number;
  question_text: string;
  created_at?: string;
  interview_id?: number;
  company?: string;
  role?: string;
  interviewer_type?: InterviewerType;
};

export type InterviewForm = {
  company: string;
  role: string;
  notes: string;
  interviewer_type: InterviewerType;
  interview_date: string;
  questions: string[];
};

export type InterviewEditForm = Omit<InterviewForm, "questions">;
