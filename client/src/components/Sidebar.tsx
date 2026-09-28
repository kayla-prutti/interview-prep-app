import type { Page } from "../types";
import { ArchiveIcon, BookIcon, CollapseIcon, PracticeIcon, QuestionIcon } from "./Icons";

type SidebarProps = {
  activePage: Page;
  collapsed: boolean;
  practiceCount: number;
  onCollapseChange: (collapsed: boolean) => void;
  onPageChange: (page: Page) => void;
};

export function Sidebar({ activePage, collapsed, practiceCount, onCollapseChange, onPageChange }: SidebarProps) {
  const itemClass = (page: Page) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${collapsed ? "md:justify-center" : ""} ${activePage === page ? "bg-[#F5822A] font-semibold text-[#202020]" : "text-[#F4F4F2] hover:bg-black/10 hover:text-white"}`;

  return (
    <aside className={`relative flex flex-col border-b border-[#2F3031] bg-[#3D3F40] px-5 py-4 text-white md:sticky md:top-0 md:h-[100dvh] md:border-r md:border-b-0 md:py-7 ${collapsed ? "md:px-3" : "md:px-5"}`}>
      <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-8 z-40 hidden h-7 w-7 place-items-center rounded-full border border-[#686A6B] bg-[#3D3F40] text-white shadow-md hover:bg-[#2F3031] md:grid" title={collapsed ? "Expand sidebar" : "Collapse sidebar"} type="button" onClick={() => onCollapseChange(!collapsed)}><CollapseIcon collapsed={collapsed} /></button>

      <button className={`flex items-center gap-3 text-left ${collapsed ? "md:justify-center" : ""}`} title={collapsed ? "i-Prep" : undefined} type="button" onClick={() => onPageChange("interviews")}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#F5822A] text-[#202020]"><BookIcon /></span>
        <span className={collapsed ? "md:hidden" : ""}>
          <span className="block text-lg font-bold leading-none">i-Prep</span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-[#ECECEA]">Personal archive</span>
        </span>
      </button>

      <nav className="mt-4 grid grid-cols-2 gap-1 md:mt-10 md:grid-cols-1 md:gap-2" aria-label="Main navigation">
        <button aria-label="Interviews" className={itemClass("interviews")} title={collapsed ? "Interviews" : undefined} type="button" onClick={() => onPageChange("interviews")}><ArchiveIcon /><span className={collapsed ? "md:hidden" : ""}>Interviews</span></button>
        <button aria-label="Question library" className={itemClass("questions")} title={collapsed ? "Question library" : undefined} type="button" onClick={() => onPageChange("questions")}><QuestionIcon /><span className={collapsed ? "md:hidden" : ""}>Question library</span></button>
        <button aria-label="Preparation" className={itemClass("practice")} title={collapsed ? "Preparation" : undefined} type="button" onClick={() => onPageChange("practice")}><PracticeIcon /><span className={collapsed ? "md:hidden" : ""}>Preparation{practiceCount > 0 && <span className="float-right ml-5 rounded-full bg-white/15 px-2 py-0.5 text-[10px]">{practiceCount}</span>}</span></button>
      </nav>

      <p className={`mt-auto hidden border-t border-white/20 px-2 pt-5 text-sm text-[#ECECEA] md:block ${collapsed ? "md:hidden" : ""}`}>A record of what you learned, one interview at a time.</p>
    </aside>
  );
}
