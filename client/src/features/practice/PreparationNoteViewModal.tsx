import type { PreparationNote } from "../../types";
import { preparationNoteStyle } from "./preparationNoteStyles";

type PreparationNoteViewModalProps = {
  note: PreparationNote;
  onClose: () => void;
  onEdit: (note: PreparationNote) => void;
};

export function PreparationNoteViewModal({ note, onClose, onEdit }: PreparationNoteViewModalProps) {
  const style = preparationNoteStyle(note.color);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#202020]/55 p-4 backdrop-blur-[2px] sm:p-6" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section aria-label={note.title} aria-modal="true" className={`relative flex max-h-[min(760px,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-sm border shadow-2xl ${style.card}`} role="dialog">
        <span aria-hidden="true" className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 -rotate-1 bg-white/35 shadow-[0_1px_2px_rgba(32,32,32,0.08)]" />
        <span aria-hidden="true" className={`absolute right-0 top-0 z-10 h-8 w-8 [clip-path:polygon(0_0,100%_0,100%_100%)] ${style.fold}`} />
        <header className="relative shrink-0 border-b border-black/10 px-7 pb-4 pt-9 sm:px-9">
          <h2 className="font-handwriting pr-8 text-4xl font-bold leading-tight text-[#202020]">{note.title}</h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 sm:px-9">
          <p className="font-handwriting whitespace-pre-wrap text-[1.65rem] leading-[1.25] text-[#303030]">{note.content}</p>
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t border-black/10 bg-white/20 px-7 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <p className="text-xs text-[#686868]">Updated {new Date(note.updated_at).toLocaleDateString()}</p>
          <div className="flex justify-end gap-3">
            <button className="rounded-md border border-black/20 bg-white/35 px-4 py-2.5 text-sm font-bold text-[#4A4A4A] hover:bg-white/60" type="button" onClick={onClose}>Close</button>
            <button className="rounded-md bg-[#202020] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4A4A4A]" type="button" onClick={() => onEdit(note)}>Edit note</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
