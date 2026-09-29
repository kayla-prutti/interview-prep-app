export type FolderTab<Value extends string> = {
  value: Value;
  label: string;
};

type FolderTabsProps<Value extends string> = {
  activeValue: Value;
  ariaLabel: string;
  panelId: string;
  tabs: FolderTab<Value>[];
  onChange: (value: Value) => void;
};

const folderColors = ["#FFFFFF", "#E4E4E1", "#CFCFCC", "#B9B9B5"];

export function FolderTabs<Value extends string>({ activeValue, ariaLabel, panelId, tabs, onChange }: FolderTabsProps<Value>) {
  return (
    <nav className="flex shrink-0 items-end gap-2 overflow-x-auto px-1 pt-3" aria-label={ariaLabel} role="tablist">
      {tabs.map((tab, index) => {
        const isActive = activeValue === tab.value;
        const folderColor = isActive ? "#F5822A" : folderColors[index % folderColors.length];

        return (
          <button
            aria-controls={panelId}
            aria-selected={isActive}
            className={`group relative min-w-[150px] flex-1 cursor-pointer rounded-t-xl border border-b-0 border-[#BDBDB8] px-5 pb-3 pt-4 text-left transition-all duration-150 hover:z-30 hover:-translate-y-1 hover:border-[#F5822A] hover:shadow-[0_0_0_2px_#FFE4D1] focus-visible:z-30 focus-visible:outline-none focus-visible:border-[#F5822A] focus-visible:ring-2 focus-visible:ring-[#FFE4D1] ${isActive ? "z-20 text-[#202020] shadow-[0_-5px_16px_rgba(32,32,32,0.08)]" : "z-10 text-[#4A4A4A]"}`}
            key={tab.value}
            role="tab"
            style={{ backgroundColor: folderColor }}
            title={`Filter by ${tab.label} interviews`}
            type="button"
            onClick={() => onChange(tab.value)}
          >
            <span className="absolute -top-2 left-4 h-3 w-16 rounded-t-lg border border-b-0 border-[#BDBDB8] transition-all duration-150 group-hover:border-[#F5822A] group-hover:shadow-[0_-2px_0_2px_#FFE4D1]" style={{ backgroundColor: folderColor }} />
            <span className="block text-xs font-bold uppercase tracking-[0.14em]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
