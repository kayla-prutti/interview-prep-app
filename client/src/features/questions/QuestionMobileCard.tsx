import { interviewerBadgeClass, interviewerLabel } from "../../lib/interviews";
import type { Question } from "../../types";
import { QuestionFavoriteButton, QuestionPracticeButton } from "./Cells";
import type { QuestionGridContext } from "./types";

type QuestionMobileCardProps = {
  actions: QuestionGridContext;
  question: Question;
};

export function QuestionMobileCard({ actions, question }: QuestionMobileCardProps) {
  return (
    <article className="rounded-lg border border-[#D6D6D2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-base font-semibold leading-6 text-[#202020]">{question.question_text}</p>
        <div className="flex shrink-0 items-center gap-1">
          {question.interviewer_type && <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${interviewerBadgeClass(question.interviewer_type)}`}>{interviewerLabel(question.interviewer_type)}</span>}
          <QuestionFavoriteButton actions={actions} question={question} />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-[#E4E4E1] pt-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#4A4A4A]">{question.company || "Company not recorded"}</p>
          {question.role && <p className="mt-0.5 truncate text-xs text-[#686868]">{question.role}</p>}
        </div>
        <QuestionPracticeButton actions={actions} question={question} />
      </div>
    </article>
  );
}
