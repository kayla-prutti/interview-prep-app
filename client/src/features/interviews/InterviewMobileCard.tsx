import { BinIcon, EyeIcon, PenIcon } from "../../components/Icons";
import { formatDate, interviewerBadgeClass, interviewerLabel } from "../../lib/interviews";
import type { Interview } from "../../types";

type InterviewMobileCardProps = {
  interview: Interview;
  onDelete: (interview: Interview) => void;
  onEdit: (interview: Interview) => void;
  onView: (interview: Interview) => void;
};

export function InterviewMobileCard({ interview, onDelete, onEdit, onView }: InterviewMobileCardProps) {
  const date = interview.interview_date ? formatDate(interview.interview_date) : formatDate(interview.created_at);

  return (
    <article className="overflow-hidden rounded-lg border border-[#D6D6D2] bg-white shadow-sm">
      <button className="w-full px-4 py-4 text-left active:bg-[#FFF0E5]" type="button" onClick={() => onView(interview)}>
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold text-[#202020]">{interview.company}</span>
            <span className="mt-1 block text-sm font-semibold leading-5 text-[#4A4A4A]">{interview.role}</span>
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${interviewerBadgeClass(interview.interviewer_type)}`}>{interviewerLabel(interview.interviewer_type)}</span>
        </span>
        <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.1em] text-[#686868]">{date}</span>
      </button>
      <footer className="flex items-center justify-between border-t border-[#E4E4E1] bg-[#FAFAF8] px-3 py-2">
        <span className="text-xs font-semibold text-[#686868]">Open interview details</span>
        <span className="flex items-center gap-1">
          <button aria-label={`View ${interview.company} interview`} className="grid h-11 w-11 place-items-center rounded-md text-[#686868] active:bg-[#FFE4D1] active:text-[#C95712]" title="View interview" type="button" onClick={() => onView(interview)}><EyeIcon /></button>
          <button aria-label={`Edit ${interview.company} interview`} className="grid h-11 w-11 place-items-center rounded-md text-[#686868] active:bg-[#FFE4D1] active:text-[#C95712]" title="Edit interview" type="button" onClick={() => onEdit(interview)}><PenIcon /></button>
          <button aria-label={`Delete ${interview.company} interview`} className="grid h-11 w-11 place-items-center rounded-md text-[#686868] active:bg-red-50 active:text-red-700" title="Delete interview" type="button" onClick={() => onDelete(interview)}><BinIcon /></button>
        </span>
      </footer>
    </article>
  );
}
