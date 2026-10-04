import { PenIcon } from "./Icons";

type AnswerRevealProps = {
  answer?: string;
  onEdit: () => void;
};

export function AnswerReveal({ answer, onEdit }: AnswerRevealProps) {
  const savedAnswer = answer?.trim();

  if (!savedAnswer) {
    return <button className="mt-4 rounded-md border border-[#F5822A] px-3 py-2 text-xs font-bold text-[#9A3D00] hover:bg-[#FFE4D1]" type="button" onClick={onEdit}>Add answer</button>;
  }

  return (
    <details className="mt-4 rounded-lg border border-[#D6D6D2] bg-[#FAFAF8]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#9A3D00]">Reveal saved answer</summary>
      <div className="flex items-start gap-4 border-t border-[#D6D6D2] px-4 py-4">
        <div className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-[#303030]">{savedAnswer}</div>
        <button aria-label="Edit saved answer" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#686868] hover:bg-[#FFE4D1] hover:text-[#C95712]" title="Edit saved answer" type="button" onClick={onEdit}><PenIcon /></button>
      </div>
    </details>
  );
}
