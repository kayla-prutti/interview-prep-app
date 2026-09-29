import { SearchIcon } from "./Icons";

type SearchFieldProps = {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
};

export function SearchField({ ariaLabel, placeholder, value, onChange, onClear, className = "" }: SearchFieldProps) {
  return (
    <div className={`relative w-full max-w-md shrink-0 ${className}`}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#686868]">
        <SearchIcon />
      </span>
      <label className="block">
        <span className="sr-only">{ariaLabel}</span>
        <input
          className="w-full rounded-md border border-[#D6D6D2] bg-white py-3 pl-11 pr-20 text-sm outline-none placeholder:text-[#8A8A86] focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]"
          placeholder={placeholder}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {value && (
        <button
          aria-label={`Clear ${ariaLabel.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-3 py-1.5 text-xs font-bold text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]"
          type="button"
          onClick={onClear}
        >
          Clear
        </button>
      )}
    </div>
  );
}
