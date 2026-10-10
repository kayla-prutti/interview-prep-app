import type { Page } from "../types";
import { ArchiveIcon, BookIcon, CollapseIcon, FlashcardIcon, PracticeIcon, QuestionIcon, StarIcon } from "./Icons";

type SidebarProps = {
  activePage: Page;
  collapsed: boolean;
  practiceCount: number;
  onCollapseChange: (collapsed: boolean) => void;
  onPageChange: (page: Page) => void;
  onShowGuide: () => void;
};

export function Sidebar({ activePage, collapsed, practiceCount, onCollapseChange, onPageChange, onShowGuide }: SidebarProps) {
  const itemClass = (page: Page) => `flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-center text-[10px] font-semibold transition-colors md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-left md:text-sm ${collapsed ? "md:justify-center" : ""} ${activePage === page ? "bg-[#F5822A] text-[#202020]" : "text-[#F4F4F2] hover:bg-black/10 hover:text-white"}`;

  return (
    <aside className={`relative z-40 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-[#2F3031] bg-[#3D3F40] px-4 pt-[env(safe-area-inset-top)] text-white md:sticky md:top-0 md:h-[100dvh] md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:py-7 ${collapsed ? "md:px-3" : "md:px-5"}`}>
      <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-8 z-40 hidden h-7 w-7 place-items-center rounded-full border border-[#686A6B] bg-[#3D3F40] text-white shadow-md hover:bg-[#2F3031] md:grid" title={collapsed ? "Expand sidebar" : "Collapse sidebar"} type="button" onClick={() => onCollapseChange(!collapsed)}><CollapseIcon collapsed={collapsed} /></button>

      <button className={`flex items-center gap-2 text-left md:gap-3 ${collapsed ? "md:justify-center" : ""}`} title={collapsed ? "i-Prep" : undefined} type="button" onClick={() => onPageChange("interviews")}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#F5822A] text-[#202020] md:h-10 md:w-10"><BookIcon /></span>
        <span className={collapsed ? "md:hidden" : ""}>
          <span className="block text-base font-bold leading-none md:text-lg">i-Prep</span>
          <span className="mt-1 hidden text-[10px] uppercase tracking-[0.18em] text-[#ECECEA] min-[360px]:block">Personal archive</span>
        </span>
      </button>

      <button aria-label="How it works" className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-sm font-bold text-[#F4F4F2] md:hidden" title="How it works" type="button" onClick={onShowGuide}>?</button>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 gap-1 border-t border-[#686A6B] bg-[#3D3F40]/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(32,32,32,0.18)] backdrop-blur-md md:static md:mt-10 md:grid-cols-1 md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none" aria-label="Main navigation">
        <button aria-label="Interviews" className={itemClass("interviews")} title={collapsed ? "Interviews" : undefined} type="button" onClick={() => onPageChange("interviews")}><ArchiveIcon /><span className={collapsed ? "md:hidden" : ""}>Interviews</span></button>
        <button aria-label="Question library" className={itemClass("questions")} title={collapsed ? "Question library" : undefined} type="button" onClick={() => onPageChange("questions")}><QuestionIcon /><span className={collapsed ? "md:hidden" : ""}><span className="md:hidden">Questions</span><span className="hidden md:inline">Question library</span></span></button>
        <button aria-label="Favorites" className={itemClass("favorites")} title={collapsed ? "Favorites" : undefined} type="button" onClick={() => onPageChange("favorites")}><StarIcon filled={activePage === "favorites"} /><span className={collapsed ? "md:hidden" : ""}>Favorites</span></button>
        <button aria-label="Flashcards" className={itemClass("flashcards")} title={collapsed ? "Flashcards" : undefined} type="button" onClick={() => onPageChange("flashcards")}><FlashcardIcon /><span className={collapsed ? "md:hidden" : ""}>Flashcards</span></button>
        <button aria-label="Preparation" className={itemClass("practice")} title={collapsed ? "Preparation" : undefined} type="button" onClick={() => onPageChange("practice")}><PracticeIcon /><span className={collapsed ? "md:hidden" : ""}>Preparation{practiceCount > 0 && <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] md:float-right md:ml-5 md:px-2 md:text-[10px]">{practiceCount}</span>}</span></button>
      </nav>

      <div className="mt-auto hidden border-t border-white/20 pt-4 md:block">
        <button aria-label="How it works" className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm font-semibold text-[#F4F4F2] hover:bg-black/10 hover:text-white ${collapsed ? "justify-center" : ""}`} title="How it works" type="button" onClick={onShowGuide}>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/40 text-xs font-bold">?</span>
          <span className={collapsed ? "md:hidden" : ""}>How it works</span>
        </button>
        <p className={`mt-3 px-2 text-sm text-[#ECECEA] ${collapsed ? "md:hidden" : ""}`}>A record of what you learned, one interview at a time.</p>
      </div>
    </aside>
  );
}
