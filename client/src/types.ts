export type InterviewerType = "recruiter" | "hiring_manager" | "technical";
export type InterviewFilter = "all" | InterviewerType;
export type Page = "interviews" | "questions" | "favorites" | "practice";

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
  is_favorite?: boolean;
  favorite_answer?: string;
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

export type PracticeInterviewDetailsForm = {
  company: string;
  role: string;
};

export type PreparationNote = {
  id: number;
  title: string;
  content: string;
  color: PreparationNoteColor;
  created_at: string;
  updated_at: string;
};

export type PreparationNoteColor = "yellow" | "pink" | "blue" | "green" | "orange";

export type PreparationNoteForm = {
  title: string;
  content: string;
  color: PreparationNoteColor;
};
