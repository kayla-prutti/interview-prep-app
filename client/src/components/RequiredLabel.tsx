import type { ReactNode } from "react";

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children} <span aria-hidden="true" className="text-[#C95712]">*</span><span className="sr-only"> required</span>
    </span>
  );
}
