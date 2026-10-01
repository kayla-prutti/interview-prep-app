import type { CustomCellRendererProps } from "ag-grid-react";
import { AddedIcon, AddPracticeIcon } from "../../components/Icons";
import type { Question } from "../../types";
import type { QuestionGridContext } from "./types";

export function QuestionPracticeCell({ context, data }: CustomCellRendererProps<Question>) {
  if (!data) return null;
  const actions = context as QuestionGridContext;
  return <div className="flex h-full items-center"><QuestionPracticeButton actions={actions} question={data} /></div>;
}

export function QuestionPracticeButton({ actions, question }: { actions: QuestionGridContext; question: Question }) {
  const isAdded = actions.isAddedToPractice(question.id);
  const isAdding = actions.isAddingToPractice(question.id);
  const isDisabled = isAdded || isAdding;
  const practiceName = actions.practiceName ?? "selected prep";
  const buttonLabel = isAdded
    ? `Added to ${practiceName}`
    : isAdding
      ? `Adding to ${practiceName}`
      : actions.canAddToPractice
        ? `Add to ${practiceName}`
        : "Choose prep";
  return (
    <button aria-label={buttonLabel} className={`flex min-h-10 max-w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold ${isDisabled ? "cursor-not-allowed bg-[#E4E4E1] text-[#686868]" : "cursor-pointer bg-[#FFE4D1] text-[#9A3D00] hover:bg-[#F5822A] hover:text-[#202020]"}`} disabled={isDisabled} title={buttonLabel} type="button" onClick={() => actions.canAddToPractice ? actions.onAddToPractice(question.id) : actions.onChoosePractice()}>
        <span className="shrink-0">{isAdded ? <AddedIcon /> : <AddPracticeIcon />}</span>
        <span className="truncate">{buttonLabel}</span>
    </button>
  );
}
