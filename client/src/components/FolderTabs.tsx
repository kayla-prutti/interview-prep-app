export type FolderTab<Value extends string> = {
  value: Value;
  label: string;
  count: number;
};

type FolderTabsProps<Value extends string> = {
  activeValue: Value;
  ariaLabel: string;
  countLabel: string;
  panelId: string;
  tabs: FolderTab<Value>[];
  onChange: (value: Value) => void;
};

const folderColors = ["#FFFFFF", "#E4E4E1", "#CFCFCC", "#B9B9B5"];

export function FolderTabs<Value extends string>({ activeValue, ariaLabel, countLabel, panelId, tabs, onChange }: FolderTabsProps<Value>) {
  return (
    <nav className="flex shrink-0 items-end gap-2 overflow-x-auto px-1 pt-3" aria-label={ariaLabel} role="tablist">
      {tabs.map((tab, index) => {
        const isActive = activeValue === tab.value;
        const folderColor = isActive ? "#F5822A" : folderColors[index % folderColors.length];

        return (
          <button
            aria-controls={panelId}
            aria-selected={isActive}
            className={`relative min-w-[150px] flex-1 rounded-t-xl border border-b-0 border-[#BDBDB8] px-5 pb-3 pt-4 text-left transition-transform hover:-translate-y-1 ${isActive ? "z-20 text-[#202020] shadow-[0_-5px_16px_rgba(32,32,32,0.08)]" : "z-10 text-[#4A4A4A]"}`}
            key={tab.value}
            role="tab"
            style={{ backgroundColor: folderColor }}
            type="button"
            onClick={() => onChange(tab.value)}
          >
            <span className="absolute -top-2 left-4 h-3 w-16 rounded-t-lg border border-b-0 border-[#BDBDB8]" style={{ backgroundColor: folderColor }} />
            <span className="block text-xs font-bold uppercase tracking-[0.14em]">{tab.label}</span>
            <span className="mt-1 block text-xs opacity-70">{tab.count} {countLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
