import { useState } from "react";

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function PasswordField({ autoComplete, label, value, onChange }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="grid gap-1.5 text-sm font-bold text-[#303030]">
      {label}
      <span className="relative">
        <input
          autoComplete={autoComplete}
          className="w-full rounded-md border border-[#D6D6D2] py-2.5 pl-3 pr-16 font-normal outline-none focus:border-[#F5822A] focus:ring-2 focus:ring-[#FFE4D1]"
          minLength={8}
          required
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 px-3 text-xs font-bold text-[#C95712] hover:text-[#9A3D00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F5822A]"
          type="button"
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
