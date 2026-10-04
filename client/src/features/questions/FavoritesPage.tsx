import { useState, type ReactNode } from "react";
import { AnswerEditorModal } from "../../components/AnswerEditorModal";
import { AnswerReveal } from "../../components/AnswerReveal";
import { FolderTabs, type FolderTab } from "../../components/FolderTabs";
import { PageHeader } from "../../components/PageHeader";
import { PaginationControls } from "../../components/PaginationControls";
import { SearchField } from "../../components/SearchField";
import { interviewerBadgeClass, interviewerLabel } from "../../lib/interviews";
import type { InterviewFilter, Question } from "../../types";
import { QuestionFavoriteButton } from "./Cells";
import type { QuestionGridContext } from "./types";

type FavoritesPageProps = {
  accountControl?: ReactNode;
  activeType: InterviewFilter;
  context: QuestionGridContext;
  error: string;
  isLoading: boolean;
  page: number;
  pageSize: number;
  questions: Question[];
  search: string;
  tabs: FolderTab<InterviewFilter>[];
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
  onSaveAnswer: (questionId: number, answer: string) => Promise<void>;
  onSearchChange: (search: string) => void;
  onTypeChange: (type: InterviewFilter) => void;
};

export function FavoritesPage({ accountControl, activeType, context, error, isLoading, page, pageSize, questions, search, tabs, total, onPageChange, onPageSizeChange, onRetry, onSaveAnswer, onSearchChange, onTypeChange }: FavoritesPageProps) {
  const [answerQuestion, setAnswerQuestion] = useState<Question | null>(null);

  return (
    <section className="w-full md:flex md:h-full md:min-h-0 md:flex-col" id="favorites">
      <PageHeader accountControl={accountControl} description="Keep your strongest questions together, write an answer, and reveal it when you are ready to practice." eyebrow="Personal collection" title="Favorite questions" />
      <SearchField ariaLabel="Search favorite questions" className="mt-7 md:mt-5" placeholder="Search favorite questions, companies, or roles" value={search} onChange={onSearchChange} onClear={() => onSearchChange("")} />
      <div className="mt-7 md:mt-5"><FolderTabs activeValue={activeType} ariaLabel="Favorite question folders" panelId="favorite-question-panel" tabs={tabs} onChange={onTypeChange} /></div>
      <section className="relative z-20 flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-b-xl rounded-tr-xl border border-[#BDBDB8] bg-white shadow-[0_14px_34px_rgba(32,32,32,0.08)]" id="favorite-question-panel" role="tabpanel">
        {isLoading && <p className="p-6 text-sm text-[#686868]">Opening favorites...</p>}
        {error && <div className="m-5 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between" role="alert"><span>{error}</span><button className="w-fit rounded-md border border-red-300 px-3 py-2 font-bold hover:bg-red-100" type="button" onClick={onRetry}>Try again</button></div>}
        {!isLoading && !error && questions.length === 0 && <div className="grid flex-1 place-items-center px-6 py-12 text-center"><div><h2 className="text-xl font-bold text-[#202020]">No favorite questions yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#686868]">Use the star in the Question Library to save questions here.</p></div></div>}
        {!isLoading && !error && questions.length > 0 && (
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F4F2] p-4 sm:p-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {questions.map((question) => (
                <article className="rounded-xl border border-[#D6D6D2] bg-white p-5 shadow-sm" key={question.id}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1"><p className="text-base font-bold leading-7 text-[#202020]">{question.question_text}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-[#4A4A4A]">{question.company || "Company not recorded"}</span>{question.interviewer_type && <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${interviewerBadgeClass(question.interviewer_type)}`}>{interviewerLabel(question.interviewer_type)}</span>}</div></div>
                    <QuestionFavoriteButton actions={context} question={question} />
                  </div>
                  <AnswerReveal answer={question.favorite_answer} onEdit={() => setAnswerQuestion(question)} />
                </article>
              ))}
            </div>
          </div>
        )}
        {!isLoading && !error && total > 0 && <PaginationControls page={page} pageSize={pageSize} totalRows={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />}
      </section>
      {answerQuestion && <AnswerEditorModal answer={answerQuestion.favorite_answer} question={answerQuestion.question_text} onClose={() => setAnswerQuestion(null)} onSave={(answer) => onSaveAnswer(answerQuestion.id, answer)} />}
    </section>
  );
}
