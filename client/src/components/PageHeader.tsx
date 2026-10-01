import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  accountControl?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action, accountControl }: PageHeaderProps) {
  return (
    <header className="relative z-30 -mx-4 flex shrink-0 flex-col gap-4 border-b border-[#D6D6D2] bg-[#F4F4F2]/95 px-4 py-5 backdrop-blur-sm sm:-mx-9 sm:flex-row sm:items-end sm:justify-between sm:px-9 md:sticky md:top-0 lg:-mx-10 lg:px-10">
      <div className={accountControl ? "pr-14 sm:pr-0" : undefined}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C95712]">{eyebrow}</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-[#202020] sm:mt-2 sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-5 text-stone-600 sm:mt-3 sm:leading-6">{description}</p>
      </div>
      {action && <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
      {accountControl && <div className="absolute right-4 top-5 sm:right-9 lg:right-10">{accountControl}</div>}
    </header>
  );
}
