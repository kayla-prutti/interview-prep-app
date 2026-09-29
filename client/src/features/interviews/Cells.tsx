import type { CustomCellRendererProps } from "ag-grid-react";
import { BinIcon, EyeIcon, PenIcon } from "../../components/Icons";
import { interviewerBadgeClass, interviewerLabel } from "../../lib/interviews";
import type { Interview } from "../../types";
import type { InterviewGridContext } from "./types";

export function InterviewTypeCell({ data }: CustomCellRendererProps<Interview>) {
  if (!data) return null;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${interviewerBadgeClass(data.interviewer_type)}`}>{interviewerLabel(data.interviewer_type)}</span>;
}

export function InterviewRoleCell({ context, data }: CustomCellRendererProps<Interview>) {
  if (!data) return null;
  const actions = context as InterviewGridContext;
  return (
    <button
      aria-label={`View details for ${data.role} at ${data.company}`}
      className="max-w-full cursor-pointer truncate text-left font-semibold text-[#3F3F3C] underline decoration-transparent underline-offset-4 transition-colors hover:text-[#C95712] hover:decoration-[#F5822A] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5822A]"
      title={`View ${data.role} interview details`}
      type="button"
      onClick={() => actions.onView(data)}
    >
      {data.role}
    </button>
  );
}

export function InterviewActionsCell({ context, data }: CustomCellRendererProps<Interview>) {
  if (!data) return null;
  const actions = context as InterviewGridContext;
  return (
    <div className="flex h-full items-center gap-1">
      <button aria-label={`View ${data.company} interview`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-stone-500 hover:bg-[#FFE4D1] hover:text-[#C95712]" onClick={() => actions.onView(data)} title="View interview" type="button"><EyeIcon /></button>
      <button aria-label={`Edit ${data.company} interview`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-stone-500 hover:bg-[#FFE4D1] hover:text-[#C95712]" onClick={() => actions.onEdit(data)} title="Edit interview" type="button"><PenIcon /></button>
      <button aria-label={`Delete ${data.company} interview`} className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => actions.onDelete(data)} title="Delete interview" type="button"><BinIcon /></button>
    </div>
  );
}
