import type { PracticeInterview } from "../types";
import { interviewerLabel } from "../lib/interviews";
import { PracticeIcon } from "./Icons";

type PracticeDestinationMenuProps = {
  activeInterview?: PracticeInterview;
  areOptionsLoaded: boolean;
  error: string;
  interviews: PracticeInterview[];
  isLoading: boolean;
  isOpen: boolean;
  onManage: () => void;
  onRetry: () => void;
  onSelect: (interviewId: number) => void;
  onToggle: () => void;
};

export function PracticeDestinationMenu({ activeInterview, areOptionsLoaded, error, interviews, isLoading, isOpen, onManage, onRetry, onSelect, onToggle }: PracticeDestinationMenuProps) {
  return (
    <div className="relative w-full">
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex h-12 w-full cursor-pointer items-center gap-3 rounded-md border bg-white px-3 text-left shadow-sm outline-none hover:border-[#F5822A] focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1] ${activeInterview ? "border-[#F5822A]" : "border-[#D6D6D2]"}`}
        type="button"
        onClick={onToggle}
      >
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${activeInterview ? "bg-[#F5822A] text-[#202020]" : "bg-[#E4E4E1] text-[#686868]"}`}><PracticeIcon /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A3D00]">Add questions to</span>
          <span className="block truncate text-sm font-bold text-[#202020]">{activeInterview ? activeInterview.company : "Choose prep interview"}</span>
        </span>
        <span aria-hidden="true" className={`text-sm text-[#686868] transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {isOpen && (
        <div aria-label="Choose preparation destination" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-80 w-full min-w-[18rem] overflow-y-auto rounded-lg border border-[#BDBDB8] bg-white p-1.5 shadow-xl" role="dialog">
          <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#686868]">Preparation destination</p>
          {isLoading && <p className="px-3 py-3 text-sm text-[#686868]">Loading prep interviews...</p>}
          {error && <div className="m-2 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert"><p>{error}</p><button className="mt-2 cursor-pointer font-bold underline underline-offset-2" type="button" onClick={onRetry}>Try again</button></div>}
          {areOptionsLoaded && !isLoading && !error && interviews.length === 0 && <p className="px-3 py-3 text-sm text-[#686868]">No prep interviews yet.</p>}
          {interviews.map((interview) => (
            <button aria-pressed={interview.id === activeInterview?.id} className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left hover:bg-[#FFF0E5] ${interview.id === activeInterview?.id ? "bg-[#FFF0E5]" : ""}`} key={interview.id} type="button" onClick={() => onSelect(interview.id)}>
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#202020]">{interview.company}</span><span className="mt-0.5 block truncate text-xs text-[#686868]">{interview.role} · {interviewerLabel(interview.interviewer_type)}</span></span>
              {interview.id === activeInterview?.id && <span className="shrink-0 text-sm font-bold text-[#C95712]">Selected</span>}
            </button>
          ))}
          <button className="mt-1 w-full cursor-pointer border-t border-[#E4E4E1] px-3 py-2.5 text-left text-sm font-bold text-[#C95712] hover:bg-[#FFF0E5] hover:text-[#9A3D00]" type="button" onClick={onManage}>Manage preparation interviews</button>
        </div>
      )}
    </div>
  );
}
