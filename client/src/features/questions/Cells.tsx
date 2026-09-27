import type { CustomCellRendererProps } from "ag-grid-react";
import { AddedIcon, AddPracticeIcon } from "../../components/Icons";
import type { Question } from "../../types";
import type { QuestionGridContext } from "./types";

export function QuestionPracticeCell({ context, data }: CustomCellRendererProps<Question>) {
  if (!data) return null;
  const actions = context as QuestionGridContext;
  const isAdded = actions.isAddedToPractice(data.id);
  return (
    <div className="flex h-full items-center">
      <button aria-label={`${isAdded ? "Remove" : "Add"} question ${isAdded ? "from" : "to"} practice`} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${isAdded ? "bg-[#E4E4E1] text-[#303030] hover:bg-[#D6D6D2]" : "bg-[#FFE4D1] text-[#9A3D00] hover:bg-[#F5822A] hover:text-[#202020]"}`} title={isAdded ? "Remove from practice" : "Add to practice"} type="button" onClick={() => actions.onTogglePractice(data.id)}>
        {isAdded ? <AddedIcon /> : <AddPracticeIcon />}
        {isAdded ? "Added" : "To practice"}
      </button>
    </div>
  );
}
