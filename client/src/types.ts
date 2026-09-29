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
  is_added_to_practice?: boolean;
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

export type PracticeInterview = {
  id: number;
  company: string;
  role: string;
  interviewer_type: InterviewerType;
  question_count: number;
  answered_count: number;
  created_at: string;
  updated_at: string;
};

export type PracticeQuestion = {
  id: number;
  practice_interview_id: number;
  source_question_id: number | null;
  question_text: string;
  answer: string;
  sort_order: number;
  source_company?: string;
  created_at: string;
  updated_at: string;
};

export type PracticeInterviewForm = {
  company: string;
  role: string;
  interviewer_type: InterviewerType;
};

export type PreparationNote = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type PreparationNoteForm = {
  title: string;
  content: string;
};
