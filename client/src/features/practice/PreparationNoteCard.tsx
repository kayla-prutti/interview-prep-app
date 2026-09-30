import { BinIcon, PenIcon } from "../../components/Icons";
import type { PreparationNote } from "../../types";
import { preparationNoteStyle } from "./preparationNoteStyles";

const positions = [
  "-rotate-[1.1deg] md:translate-y-1",
  "rotate-[0.8deg] md:translate-y-4",
  "-rotate-[0.45deg]",
  "rotate-[1deg] md:translate-y-2",
  "-rotate-[0.75deg] md:translate-y-5",
];

type PreparationNoteCardProps = {
  index: number;
  note: PreparationNote;
  onDelete: (note: PreparationNote) => void;
  onEdit: (note: PreparationNote) => void;
  onView: (note: PreparationNote) => void;
};

export function PreparationNoteCard({ index, note, onDelete, onEdit, onView }: PreparationNoteCardProps) {
  const style = preparationNoteStyle(note.color);

  return (
    <article className={`group relative flex h-72 flex-col overflow-hidden rounded-sm border px-6 pb-5 pt-7 shadow-[0_9px_18px_rgba(32,32,32,0.16)] transition duration-200 hover:z-10 hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_15px_28px_rgba(32,32,32,0.2)] ${style.card} ${positions[index % positions.length]}`}>
      <button aria-label={`View ${note.title}`} className="absolute inset-0 z-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9A3D00]" title="View full note" type="button" onClick={() => onView(note)} />
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 -rotate-1 bg-white/35 shadow-[0_1px_2px_rgba(32,32,32,0.08)]" />
      <span aria-hidden="true" className={`pointer-events-none absolute right-0 top-0 z-10 h-6 w-6 [clip-path:polygon(0_0,100%_0,100%_100%)] ${style.fold}`} />
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3">
        <h3 className="font-handwriting line-clamp-2 pr-1 text-[1.8rem] font-bold leading-[1.05] text-[#202020]">{note.title}</h3>
        <div className="pointer-events-auto flex shrink-0 gap-1 transition-opacity md:opacity-55 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button aria-label={`Edit ${note.title}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-[#4A4A4A] hover:bg-white/55 hover:text-[#9A3D00]" title="Edit note" type="button" onClick={() => onEdit(note)}><PenIcon /></button>
          <button aria-label={`Delete ${note.title}`} className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-[#4A4A4A] hover:bg-white/55 hover:text-red-700" title="Delete note" type="button" onClick={() => onDelete(note)}><BinIcon /></button>
        </div>
      </div>
      <p className="font-handwriting pointer-events-none relative z-10 mt-4 line-clamp-6 min-h-0 flex-1 whitespace-pre-wrap text-[1.45rem] leading-[1.15] text-[#353535]">{note.content}</p>
      <p className="pointer-events-none relative z-10 mt-5 border-t border-black/10 pt-3 text-xs text-[#686868]">Updated {new Date(note.updated_at).toLocaleDateString()}</p>
    </article>
  );
}
