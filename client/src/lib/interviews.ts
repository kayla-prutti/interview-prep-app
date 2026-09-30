import type { InterviewFilter, InterviewForm, InterviewerType } from "../types";

export const emptyInterviewForm: InterviewForm = {
  company: "",
  role: "",
  notes: "",
  interviewer_type: "recruiter",
  interview_date: new Date().toISOString().slice(0, 10),
  questions: [""],
};

export const interviewFilterSections: { type: InterviewFilter; title: string }[] = [
  { type: "all", title: "All" },
  { type: "recruiter", title: "Recruiter" },
  { type: "hiring_manager", title: "Hiring manager" },
  { type: "technical", title: "Technical" },
];

export function formatDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function interviewerLabel(type: InterviewerType) {
  return type === "hiring_manager" ? "Hiring manager" : type[0].toUpperCase() + type.slice(1);
}

export function interviewerBadgeClass(type: InterviewerType) {
  return type === "technical"
    ? "bg-[#FFE4D1] text-[#9A3D00]"
    : type === "recruiter"
      ? "bg-[#E4E4E1] text-[#202020]"
      : "bg-[#303030] text-white";
}
