import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 -mx-5 flex shrink-0 flex-col gap-5 border-b border-[#D6D6D2] bg-[#F4F4F2]/95 px-5 py-5 backdrop-blur-sm sm:-mx-9 sm:flex-row sm:items-end sm:justify-between sm:px-9 lg:-mx-10 lg:px-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C95712]">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#202020] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {action}
    </header>
  );
}
