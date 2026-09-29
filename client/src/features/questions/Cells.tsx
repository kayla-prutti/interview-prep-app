import type { CustomCellRendererProps } from "ag-grid-react";
import { AddedIcon, AddPracticeIcon } from "../../components/Icons";
import type { Question } from "../../types";
import type { QuestionGridContext } from "./types";

export function QuestionPracticeCell({ context, data }: CustomCellRendererProps<Question>) {
  if (!data) return null;
  const actions = context as QuestionGridContext;
  const isAdded = actions.isAddedToPractice(data.id);
  const isAdding = actions.isAddingToPractice(data.id);
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
    <div className="flex h-full items-center">
      <button aria-label={buttonLabel} className={`flex max-w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${isDisabled ? "cursor-not-allowed bg-[#E4E4E1] text-[#686868]" : "cursor-pointer bg-[#FFE4D1] text-[#9A3D00] hover:bg-[#F5822A] hover:text-[#202020]"}`} disabled={isDisabled} title={buttonLabel} type="button" onClick={() => actions.canAddToPractice ? actions.onAddToPractice(data.id) : actions.onChoosePractice()}>
        <span className="shrink-0">{isAdded ? <AddedIcon /> : <AddPracticeIcon />}</span>
        <span className="truncate">{buttonLabel}</span>
      </button>
    </div>
  );
}
