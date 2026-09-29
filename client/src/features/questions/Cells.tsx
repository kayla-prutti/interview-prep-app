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
  return (
    <div className="flex h-full items-center">
      <button aria-label={isAdded ? "Question added to this prep interview" : isAdding ? "Adding question to practice" : actions.canAddToPractice ? "Add question to practice" : "Choose a prep interview"} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${isDisabled ? "cursor-not-allowed bg-[#E4E4E1] text-[#686868]" : "cursor-pointer bg-[#FFE4D1] text-[#9A3D00] hover:bg-[#F5822A] hover:text-[#202020]"}`} disabled={isDisabled} title={isAdded ? "Already added to this prep interview" : isAdding ? "Adding question..." : actions.canAddToPractice ? "Add to practice" : "Choose a prep interview first"} type="button" onClick={() => actions.canAddToPractice ? actions.onAddToPractice(data.id) : actions.onChoosePractice()}>
        {isAdded ? <AddedIcon /> : <AddPracticeIcon />}
        {isAdded ? "Added" : isAdding ? "Adding..." : actions.canAddToPractice ? "To practice" : "Choose prep"}
      </button>
    </div>
  );
}
